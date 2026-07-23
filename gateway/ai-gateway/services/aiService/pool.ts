/**
 * aiService/pool.ts — AI 資源池
 *
 * 管理 AI 伺服器連線設定、動態路由、容錯切換。
 * 資料從 data-gateway 以 JSON 載入，直接作為 AI伺服器記錄 使用，
 * 不經過 class 建構（減少不必要的轉換開銷）。
 *
 * Runtime 狀態（當前併發數、連續失敗次數、解禁時間戳）獨立管理，
 * 不與持久化資料混雜。
 */

import { BasePool } from '@dui/pool';
import { error, info } from '@dui/util';
import { list } from '../dataGwClient.ts';
import { getProviderAdapter, type AIProviderAdapter, type AIRequest, type AIResponse } from './provider/adapter.ts';
import type { AI伺服器記錄, AI模型定義 } from '../../database/models/AI伺服器.ts';

// ── Runtime 狀態型別 ──

interface ServerRuntime {
  當前總併發: number;
  連續失敗次數: number;
  解禁時間戳: number;
}

// ── AI 資源池 ──

export class AIResourcePool extends BasePool<string, AI伺服器記錄> {
  private adapters: Map<string, AIProviderAdapter> = new Map();
  private runtime = new Map<string, ServerRuntime>();

  /** 取得或初始化伺服器的 runtime 狀態 */
  private getRuntime(serverId: string): ServerRuntime {
    let state = this.runtime.get(serverId);
    if (!state) {
      state = { 當前總併發: 0, 連續失敗次數: 0, 解禁時間戳: 0 };
      this.runtime.set(serverId, state);
    }
    return state;
  }

  /** 從 data-gateway 載入所有 AI 伺服器設定 */
  async loadServers(): Promise<void> {
    try {
      const servers = await list<Record<string, unknown>>('AI伺服器', undefined, { limit: 100 });
      for (const raw of servers) {
        const record = raw as unknown as AI伺服器記錄;
        if (!record.id) continue;
        this.set(record.id, record, false, true); // persistent=true
        this.runtime.delete(record.id); // runtime 狀態從預設開始

        if (!this.adapters.has(record.provider)) {
          const adapter = await getProviderAdapter(record.provider);
          if (adapter) {
            this.adapters.set(record.provider, adapter);
            await info('AI Pool', `載入 provider adapter: ${record.provider}`);
          }
        }
      }
      await info('AI Pool', `已載入 ${servers.length} 個 AI 伺服器`);
    } catch (err) {
      await error('AI Pool', `載入 AI 伺服器失敗：${err}`);
    }
  }

  /** 取得 provider adapter */
  getAdapter(provider: string): AIProviderAdapter | null {
    return this.adapters.get(provider) ?? null;
  }

  /** 根據模型名稱找到適合的伺服器（輪詢 + 容錯） */
  selectServer(model: string): AI伺服器記錄 | null {
    const now = Date.now();
    const candidates: AI伺服器記錄[] = [];

    for (const key of this.keys()) {
      const record = this.get(key);
      if (!record) continue;
      const rt = this.getRuntime(record.id);

      if (!record.啟用) continue;
      if (rt.解禁時間戳 > now) continue;
      if (rt.當前總併發 >= record.動態全域併發上限) continue;

      const hasModel = record.模型列表.some((m) =>
        (m.名稱 && typeof m.名稱 === 'object' && 'toString' in m.名稱)
          ? String(m.名稱).includes(model)
          : false,
      );
      if (!hasModel) continue;

      candidates.push(record);
    }

    if (candidates.length === 0) return null;

    // 選擇當前併發數最低的伺服器（最不忙碌）
    candidates.sort((a, b) => this.getRuntime(a.id).當前總併發 - this.getRuntime(b.id).當前總併發);
    return candidates[0];
  }

  /** 發送 AI 請求（自動路由 + 容錯） */
  async dispatch(req: AIRequest): Promise<AIResponse> {
    const record = this.selectServer(req.model);
    if (!record) throw new Error(`找不到可處理模型 ${req.model} 的 AI 伺服器`);

    const adapter = this.getAdapter(record.provider);
    if (!adapter) throw new Error(`不支援的 provider：${record.provider}`);

    const rt = this.getRuntime(record.id);
    rt.當前總併發++;
    try {
      const response = await adapter.chat({ url: record.url, apiKey: record.apiKey }, req);
      rt.連續失敗次數 = 0;
      return response;
    } catch (err) {
      rt.連續失敗次數++;
      if (rt.連續失敗次數 >= 3) {
        rt.解禁時間戳 = Date.now() + record.冷卻秒數 * 1000;
        await error('AI Pool', `伺服器 ${record.id} 連續失敗 3 次，冷卻 ${record.冷卻秒數} 秒`);
      }
      throw err;
    } finally {
      rt.當前總併發--;
    }
  }

  /** Heartbeat：檢查 adapter 連線狀態 */
  protected override async onHeartbeat(): Promise<void> {
    for (const key of this.keys()) {
      const record = this.get(key);
      if (!record) continue;
      const adapter = this.getAdapter(record.provider);
      if (!adapter) continue;
      try {
        await adapter.ping({ url: record.url, apiKey: record.apiKey });
      } catch {
        await error('AI Pool', `Heartbeat 失敗：${record.id} (${record.provider})`);
      }
    }
  }

  protected override async onFlush(_dirty: Map<string, unknown>): Promise<void> {
    // no-op: AI 伺服器設定由 data-gateway 直接管理，不經由 pool flush
  }

  protected override async onEvict(_evicted: Map<string, unknown>): Promise<void> {
    // 被淘汰時清理 runtime 狀態
    for (const key of _evicted.keys()) {
      this.runtime.delete(key);
    }
  }
}

// ── 單例 ──

export const aiPool = new AIResourcePool({
  heartbeatIntervalMs: 30_000, // 每 30 秒檢查 adapter 連線
});