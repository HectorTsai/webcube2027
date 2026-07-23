/**
 * aiService/pool.ts — AI 資源池
 *
 * 管理 AI 伺服器實體、動態路由、容錯切換。
 * 資料讀寫透過 dataGwClient 與 data-gateway 互動。
 */

import { BasePool } from '@dui/pool';
import { error, info } from '@dui/util';
import { list } from '../dataGwClient.ts';
import { getProviderAdapter, type AIProviderAdapter, type AI能力 } from './provider/adapter.ts';
import AI伺服器 from '../../database/models/AI伺服器.ts';

// ── 型別 ──

interface AIRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  id: string;
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

interface AIResourcePoolOptions {
  cleanupIntervalMs?: number;
  maxIdleMs?: number;
  heartbeatIntervalMs?: number;
}

// ── AI 資源池 ──

export class AIResourcePool extends BasePool<string, AI伺服器> {
  private adapters: Map<string, AIProviderAdapter> = new Map();

  constructor(options?: AIResourcePoolOptions) {
    super(options);
  }

  /** 從 data-gateway 載入所有 AI 伺服器設定 */
  async loadServers(): Promise<void> {
    try {
      const servers = await list<Record<string, unknown>>('AI伺服器', undefined, { limit: 100 });
      for (const raw of servers) {
        const 伺服器 = new AI伺服器(raw);
        this.set(伺服器.id, 伺服器, false, true); // persistent=true

        // 初始化 provider adapter
        if (!this.adapters.has(伺服器.provider)) {
          const adapter = getProviderAdapter(伺服器.provider);
          if (adapter) {
            this.adapters.set(伺服器.provider, adapter);
            await info('AI Pool', `載入 provider adapter: ${伺服器.provider}`);
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
  selectServer(model: string): AI伺服器 | null {
    const now = Date.now();
    const candidates: AI伺服器[] = [];

    for (const 伺服器 of this.values()) {
      if (!伺服器.啟用) continue;
      if (伺服器.解禁時間戳 > now) continue;
      if (伺服器.當前總併發 >= 伺服器.動態全域併發上限) continue;

      const hasModel = 伺服器.模型列表.some((m) => m.名稱.toString().includes(model));
      if (!hasModel) continue;

      candidates.push(伺服器);
    }

    if (candidates.length === 0) return null;

    // 選擇當前併發數最低的伺服器（最不忙碌）
    candidates.sort((a, b) => a.當前總併發 - b.當前總併發);
    return candidates[0];
  }

  /** 發送 AI 請求（自動路由 + 容錯） */
  async dispatch(req: AIRequest): Promise<AIResponse> {
    const 伺服器 = this.selectServer(req.model);
    if (!伺服器) throw new Error(`找不到可處理模型 ${req.model} 的 AI 伺服器`);

    const adapter = this.getAdapter(伺服器.provider);
    if (!adapter) throw new Error(`不支援的 provider：${伺服器.provider}`);

    伺服器.當前總併發++;
    try {
      const response = await adapter.chat(伺服器, req);
      // 成功：重設失敗計數
      伺服器.連續失敗次數 = 0;
      return response;
    } catch (err) {
      伺服器.連續失敗次數++;
      if (伺服器.連續失敗次數 >= 3) {
        伺服器.解禁時間戳 = Date.now() + 伺服器.冷卻秒數 * 1000;
        await error('AI Pool', `伺服器 ${伺服器.id} 連續失敗 3 次，冷卻 ${伺服器.冷卻秒數} 秒`);
      }
      throw err;
    } finally {
      伺服器.當前總併發--;
    }
  }

  /** Heartbeat：檢查 adapter 連線狀態 */
  protected override async onHeartbeat(): Promise<void> {
    for (const 伺服器 of this.values()) {
      const adapter = this.getAdapter(伺服器.provider);
      if (!adapter?.ping) continue;
      try {
        await adapter.ping(伺服器);
      } catch {
        await error('AI Pool', `Heartbeat 失敗：${伺服器.id} (${伺服器.provider})`);
      }
    }
  }

  protected override async onFlush(_dirty: Map<string, AI伺服器>): Promise<void> {
    // no-op: AI 伺服器狀態為記憶體即時狀態，不延遲寫回
  }

  protected override async onEvict(_evicted: Map<string, AI伺服器>): Promise<void> {
    // 目前沒有需要清理的資源
  }
}

// ── 單例 ──

export const aiPool = new AIResourcePool({
  heartbeatIntervalMs: 30_000, // 每 30 秒檢查 adapter 連線
});