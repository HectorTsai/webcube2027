// AI Pool Manager — Provider 選擇、加權負載均衡、自適應限流、Fallback 鏈
// 這是 AI Service 的核心，所有 AI 請求都透過此模組分派

import { Context } from 'hono';
import { AIProvider, AI聊天訊息, AI回應, AI能力, AITaskConfig, ToolDefinition } from './provider/adapter.ts';
import { OpenAIProvider } from './provider/openai.ts';
import { AnthropicProvider } from './provider/anthropic.ts';
import { GeminiProvider } from './provider/gemini.ts';
import { OllamaProvider } from './provider/ollama.ts';
import { info, error } from '../../utils/logger.ts';
import { 資料池 } from '../../database/資料池.ts';
import AI伺服器, { AI模型定義 } from '../../database/models/AI伺服器.ts';

// ── Provider 路由表 ──

const PROVIDER_OPENAI_COMPATIBLE = new Set([
  'openai', 'deepseek', 'groq', 'minmax', 'together', 'lmstudio',
  'azure', 'mistral', 'cohere', 'perplexity', 'openrouter',
  'cerebras', 'siliconflow', 'agnes', 'nvidia',
]);
const PROVIDER_OLLAMA = new Set(['ollama']);
const PROVIDER_ANTHROPIC = new Set(['anthropic']);
const PROVIDER_GEMINI = new Set(['gemini']);

// ── 常數 ──

const RECOVER_CONSECUTIVE = 5;   // 連續成功 N 次後，排程才允許回升
const FAIL_COOLDOWN_COUNT = 3;   // 連續失敗 N 次後，觸發單 model 冷卻
const RECOVER_RATE = 1.10;       // 回升倍率（每次 +10%）
const THROTTLE_RATE = 0.85;      // 429 打折率（保留 85%）
const MAX_RETRIES = 3;

// ── RPM 視窗記錄 ──

interface RPM視窗 {
  次數: number;
  tokens: number;
  視窗時間戳: number; // ms
}

// ── Model 狀態介面（供 API 輸出） ──

export interface Model狀態 {
  id: string;                    // 模型唯一鍵
  server名稱: string;
  provider: string;
  模型名稱: string;
  能力值: number;
  擅長能力: string[];
  目前併發數: number;
  動態併發上限: number;
  併發天花板: number;
  動態RPM: number;
  RPM天花板: number;
  動態TPM: number;
  TPM天花板: number;
  連續成功次數: number;
  連續失敗次數: number;
  冷卻中: boolean;
  冷卻剩餘秒數: number;
  server啟用: boolean;
  收費: boolean;
}

export class AIPoolManager {
  private ctx?: Context;

  // 長駐記憶體快取：共享所有連線狀態
  public static poolLoaded = false;
  public static servers = new Map<string, AI伺服器>();
  public static hwScoreUpdating = false;
  private static checkIntervalStarted = false;

  // RPM 滑動視窗 — 每個 model 獨立追蹤
  static rpmTracker = new Map<string, RPM視窗>();

  constructor(c?: Context) {
    this.ctx = c;

    if (!AIPoolManager.checkIntervalStarted) {
      AIPoolManager.checkIntervalStarted = true;
      setInterval(() => this.檢查並更新硬體分數(), 60000);
    }
  }

  // ═══════════════════════════════════════════
  //  初始化
  // ═══════════════════════════════════════════

  public async 觸發Pool載入(): Promise<void> {
    if (AIPoolManager.poolLoaded) return;

    const result = await 資料池.查詢所有列表<AI伺服器>('AI伺服器', 100, 0);
    const servers = result.data ?? [];

    for (const serverInstance of servers) {
      await serverInstance.初始化();
      if (!AIPoolManager.servers.has(serverInstance.id)) {
        AIPoolManager.servers.set(serverInstance.id, serverInstance);
      }
    }

    AIPoolManager.poolLoaded = true;
    await info('AIPool', `[初始化] 成功加載 ${AIPoolManager.servers.size} 台 AI 伺服器進入記憶體自適應調度池。`);
  }

  // ═══════════════════════════════════════════
  //  核心請求調度引擎
  // ═══════════════════════════════════════════

  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    taskConfig?: AITaskConfig,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<{ 回應: AI回應; serverID: string; providerType: string }> {
    const 最低能力值 = taskConfig?.最低能力值 ?? 0;
    const 需求能力 = taskConfig?.需求能力 ?? [];

    await this.觸發Pool載入();

    const 全部 = Array.from(AIPoolManager.servers.values())
      .filter(s => s.啟用 && this.檢查有效日期(s));

    // Fallback 鏈: L3 網站自備 → L2 系統收費 → L2 系統免費
    // 簡化：用網站ID 有/無區分 L3/L2，再用收費區分付費/免費
    const L3 = 全部.filter(s => !!s.網站ID);
    const L2收費 = 全部.filter(s => !s.網站ID && s.收費);
    const L2免費 = 全部.filter(s => !s.網站ID && !s.收費);

    const tiers = [L3, L2收費, L2免費];

    for (const tier of tiers) {
      const result = await this.選取並執行(tier, 最低能力值, 需求能力, 系統提示, 對話歷史, options);
      if (result) return result;
    }

    throw new Error('沒有可用的 AI server。請確認系統管理員已設定至少一台 AI server，或網站管理員已設定自備 API key。');
  }

  /**
   * 帶工具定義的對話請求（Function Calling）
   * 
   * 與 聊天() 相同流程，但會：
   * 1. 過濾出標記了「工具調用」能力的 model
   * 2. 呼叫 provider.聊天含工具() 而非 provider.聊天()
   * 3. 若 provider 不支援聊天含工具，自動 fallback
   */
  async 聊天含工具(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    工具定義: ToolDefinition[],
    taskConfig?: AITaskConfig,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<{ 回應: AI回應; serverID: string; providerType: string }> {
    const 最低能力值 = taskConfig?.最低能力值 ?? 0;
    // 合併 taskConfig 需求能力 + 強制要求「工具調用」
    const 需求能力 = [...(taskConfig?.需求能力 ?? []), '工具調用' as AI能力];

    await this.觸發Pool載入();

    const 全部 = Array.from(AIPoolManager.servers.values())
      .filter(s => s.啟用 && this.檢查有效日期(s));

    const L3 = 全部.filter(s => !!s.網站ID);
    const L2收費 = 全部.filter(s => !s.網站ID && s.收費);
    const L2免費 = 全部.filter(s => !s.網站ID && !s.收費);

    const tiers = [L3, L2收費, L2免費];

    for (const tier of tiers) {
      const result = await this.選取並執行含工具(tier, 最低能力值, 需求能力, 系統提示, 對話歷史, 工具定義, options);
      if (result) return result;
    }

    throw new Error('沒有可用的 AI server（需支援工具調用 / Function Calling）。');
  }

  // ═══════════════════════════════════════════
  //  自適應恢復（排程呼叫）
  // ═══════════════════════════════════════════

  /**
   * 由排程定期呼叫：解禁冷卻已到期的 model/server，並對連續成功者慢速回升動態上限。
   * 此方法不需要 Context（純記憶體操作）。
   */
  static async 自適應恢復(): Promise<{ 解禁數: number; 回升數: number }> {
    const now = Date.now();
    let 解禁數 = 0;
    let 回升數 = 0;

    for (const server of AIPoolManager.servers.values()) {
      // ── Server 級解禁 ──
      if (server.解禁時間戳 > 0 && now >= server.解禁時間戳) {
        server.解禁時間戳 = 0;
        server.連續失敗次數 = 0;
        解禁數++;
      }

      // ── Model 級解禁 + 回升 ──
      for (const m of server.模型列表) {
        // 解禁
        if (m.解禁時間戳 > 0 && now >= m.解禁時間戳) {
          m.解禁時間戳 = 0;
          m.連續失敗次數 = 0;
          解禁數++;
        }

        // 回升：連續成功 N 次 → 動態上限 +2%
        if (m.連續成功次數 >= RECOVER_CONSECUTIVE) {
          const oldRPM = m.動態每分次數上限;
          const oldTPM = m.動態每分Token上限;
          const oldConc = m.動態併發數上限;

          m.動態每分次數上限 = Math.min(
            Math.round(m.動態每分次數上限 * RECOVER_RATE),
            m.每分次數上限
          );
          m.動態每分Token上限 = Math.min(
            Math.round(m.動態每分Token上限 * RECOVER_RATE),
            m.每分Token上限
          );
          m.動態併發數上限 = Math.min(
            Math.round(m.動態併發數上限 * RECOVER_RATE),
            m.併發數上限
          );

          if (oldRPM !== m.動態每分次數上限 || oldTPM !== m.動態每分Token上限 || oldConc !== m.動態併發數上限) {
            回升數++;
            // 回升後重置計數器，等下一次積累
            m.連續成功次數 = 0;
          }
        }
      }

      // Server 級動態併發回升
      if (server.連續失敗次數 === 0 && server.動態全域併發上限 < server.併發數上限) {
        server.動態全域併發上限 = Math.min(
          Math.round(server.動態全域併發上限 * RECOVER_RATE),
          server.併發數上限
        );
      }
    }

    if (解禁數 > 0 || 回升數 > 0) {
      await info('AIPool', `[自適應恢復] 解禁 ${解禁數} 項，回升 ${回升數} 項動態上限`);
    }

    return { 解禁數, 回升數 };
  }

  // ═══════════════════════════════════════════
  //  Model 狀態 API
  // ═══════════════════════════════════════════

  /** 列出所有 model 的大綱狀態（不包含 apiKey） */
  static 列出模型狀態(): Model狀態[] {
    const now = Date.now();
    const result: Model狀態[] = [];

    for (const server of AIPoolManager.servers.values()) {
      for (let i = 0; i < server.模型列表.length; i++) {
        const m = server.模型列表[i];
        const 冷卻中 = m.解禁時間戳 > 0 && now < m.解禁時間戳;
        const r = AIPoolManager.rpmTracker.get(`${server.id}::${m.名稱}`);

        result.push({
          id: `${server.id}__${i}`,
          server名稱: server.名稱,
          provider: server.provider,
          模型名稱: m.名稱,
          能力值: m.能力值,
          擅長能力: m.擅長能力,
          目前併發數: m.當前併發數,
          動態併發上限: m.動態併發數上限,
          併發天花板: m.併發數上限,
          動態RPM: m.動態每分次數上限,
          RPM天花板: m.每分次數上限,
          動態TPM: m.動態每分Token上限,
          TPM天花板: m.每分Token上限,
          連續成功次數: m.連續成功次數,
          連續失敗次數: m.連續失敗次數,
          冷卻中,
          冷卻剩餘秒數: 冷卻中 ? Math.ceil((m.解禁時間戳 - now) / 1000) : 0,
          server啟用: server.啟用,
          收費: server.收費,
        });
      }
    }
    return result;
  }

  /** 取出單一 model 細節（含即時 RPM 用量，不含 apiKey） */
  static 取得模型細節(id: string): Model狀態 | null {
    const parts = id.split('__');
    if (parts.length !== 2) return null;

    const serverId = parts[0];
    const modelIdx = parseInt(parts[1], 10);

    const server = AIPoolManager.servers.get(serverId);
    if (!server || modelIdx < 0 || modelIdx >= server.模型列表.length) return null;

    const m = server.模型列表[modelIdx];
    const now = Date.now();
    const 冷卻中 = m.解禁時間戳 > 0 && now < m.解禁時間戳;
    const r = AIPoolManager.rpmTracker.get(`${serverId}::${m.名稱}`);
    const 本分鐘用量 = r && (now - r.視窗時間戳 < 60000) ? r.次數 : 0;
    const 本分鐘Token = r && (now - r.視窗時間戳 < 60000) ? r.tokens : 0;

    return {
      id,
      server名稱: server.名稱,
      provider: server.provider,
      模型名稱: m.名稱,
      能力值: m.能力值,
      擅長能力: m.擅長能力,
      目前併發數: m.當前併發數,
      動態併發上限: m.動態併發數上限,
      併發天花板: m.併發數上限,
      動態RPM: m.動態每分次數上限,
      RPM天花板: m.每分次數上限,
      動態TPM: m.動態每分Token上限,
      TPM天花板: m.每分Token上限,
      連續成功次數: m.連續成功次數,
      連續失敗次數: m.連續失敗次數,
      冷卻中,
      冷卻剩餘秒數: 冷卻中 ? Math.ceil((m.解禁時間戳 - now) / 1000) : 0,
      server啟用: server.啟用,
      收費: server.收費,
      // 即時用量（覆蓋上方欄位，僅細節才有）
      本分鐘用量: 本分鐘用量 as number,
      本分鐘Token用量: 本分鐘Token as number,
    } as Model狀態 & { 本分鐘用量: number; 本分鐘Token用量: number };
  }

  // ═══════════════════════════════════════════
  //  內部：核心選取與執行
  // ═══════════════════════════════════════════

  private async 選取並執行(
    servers: AI伺服器[],
    最低能力值: number,
    需求能力: AI能力[],
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<{ 回應: AI回應; serverID: string; providerType: string } | null> {
    const now = Date.now();

    // 1. 收集所有合格 candidate（model + server 級限制全檢查）
    interface Candidate {
      server: AI伺服器;
      model: AI模型定義;
      有效分: number;
    }

    const candidates: Candidate[] = [];

    for (const s of servers) {
      // Server 級檢查
      if (s.解禁時間戳 > 0 && now < s.解禁時間戳) continue;
      if (s.當前總併發 >= s.動態全域併發上限 && s.動態全域併發上限 > 0) continue;

      for (const m of s.模型列表) {
        if (m.能力值 < 最低能力值) continue;
        if (!this.能力全匹配(m.擅長能力, 需求能力)) continue;

        // Model 級限制檢查
        if (m.解禁時間戳 > 0 && now < m.解禁時間戳) continue;
        if (m.當前併發數 >= m.動態併發數上限 && m.動態併發數上限 > 0) continue;

        // RPM 檢查
        const rpmKey = `${s.id}::${m.名稱}`;
        const r = AIPoolManager.rpmTracker.get(rpmKey);
        if (r && now - r.視窗時間戳 < 60000) {
          if (m.動態每分次數上限 > 0 && r.次數 >= m.動態每分次數上限) continue;
          if (m.動態每分Token上限 > 0 && r.tokens >= m.動態每分Token上限) continue;
        }

        // 有效分 = 能力值 × 剩餘容量比率（越不忙越高）
        const capRatio = this.計算剩餘容量比率(m, r, now);
        const 有效分 = m.能力值 * capRatio;

        if (有效分 > 0) {
          candidates.push({ server: s, model: m, 有效分 });
        }
      }
    }

    if (candidates.length === 0) return null;

    // 2. 按有效分降冪排序，優先選最不忙的
    candidates.sort((a, b) => b.有效分 - a.有效分);

    // 3. 從前幾名中加權隨機挑選，最多重試 3 次
    const topN = Math.min(candidates.length, 5);
    const attempted = new Set<number>();

    for (let attempt = 0; attempt < Math.min(MAX_RETRIES, topN); attempt++) {
      // 從 topN 中加權隨機挑選
      const available = candidates
        .slice(0, topN)
        .filter((_, i) => !attempted.has(i));

      if (available.length === 0) break;

      let 總分 = 0;
      for (const c of available) 總分 += c.有效分;
      if (總分 === 0) break;

      let 隨機值 = Math.random() * 總分;
      let 選中: Candidate | null = null;

      for (let i = 0; i < topN; i++) {
        if (attempted.has(i)) continue;
        const c = candidates[i];
        隨機值 -= c.有效分;
        if (隨機值 <= 0) {
          選中 = c;
          attempted.add(i);
          break;
        }
      }

      if (!選中) continue;

      // 4. 建立 provider 並執行
      let provider: AIProvider | null = null;
      try {
        provider = await this.建立Provider(選中.server, 選中.model.名稱);
      } catch { continue; }
      if (!provider) continue;

      try {
        // 執行前：increment 計數器
        選中.model.當前併發數++;
        選中.server.當前總併發++;

        const mergedOptions = { ...options, model: options?.model || 選中.model.名稱 };
        const 回應 = await provider.聊天(系統提示, 對話歷史, mergedOptions);

        // 成功：記錄 RPM、increment 成功計數
        this.記錄RPMUsage(選中.server.id, 選中.model.名稱, 回應.token數);
        選中.model.連續成功次數++;
        選中.model.連續失敗次數 = 0;

        return {
          回應,
          serverID: 選中.server.id,
          providerType: 選中.server.provider,
        };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await error('AIPool', `${選中.server.id}/${選中.model.名稱} 請求失敗: ${errMsg}`);

        // 判斷是否為 429
        if (errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('Rate limit')) {
          this.觸發429衰減(選中.server, 選中.model);
        } else {
          選中.model.連續失敗次數++;
          選中.model.連續成功次數 = 0;
          if (選中.model.連續失敗次數 >= FAIL_COOLDOWN_COUNT) {
            選中.model.解禁時間戳 = Date.now() + 選中.model.冷卻秒數 * 1000;
            await info('AIPool', `${選中.server.id}/${選中.model.名稱} 連續失敗 ${FAIL_COOLDOWN_COUNT} 次，冷卻 ${選中.model.冷卻秒數} 秒`);
          }
        }
      } finally {
        // 無論成敗都 decrement
        選中.model.當前併發數 = Math.max(0, 選中.model.當前併發數 - 1);
        選中.server.當前總併發 = Math.max(0, 選中.server.當前總併發 - 1);
      }
    }

    return null;
  }

  /** 帶工具調用的選取並執行 — 與選取並執行() 相同但呼叫 provider.聊天含工具() */
  private async 選取並執行含工具(
    servers: AI伺服器[],
    最低能力值: number,
    需求能力: AI能力[],
    系統提示: string,
    對話歷史: AI聊天訊息[],
    工具定義: ToolDefinition[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<{ 回應: AI回應; serverID: string; providerType: string } | null> {
    const now = Date.now();

    interface Candidate {
      server: AI伺服器;
      model: AI模型定義;
      有效分: number;
    }

    const candidates: Candidate[] = [];

    for (const s of servers) {
      if (s.解禁時間戳 > 0 && now < s.解禁時間戳) continue;
      if (s.當前總併發 >= s.動態全域併發上限 && s.動態全域併發上限 > 0) continue;

      for (const m of s.模型列表) {
        if (m.能力值 < 最低能力值) continue;
        if (!this.能力全匹配(m.擅長能力, 需求能力)) continue;
        if (m.解禁時間戳 > 0 && now < m.解禁時間戳) continue;
        if (m.當前併發數 >= m.動態併發數上限 && m.動態併發數上限 > 0) continue;

        const rpmKey = `${s.id}::${m.名稱}`;
        const r = AIPoolManager.rpmTracker.get(rpmKey);
        if (r && now - r.視窗時間戳 < 60000) {
          if (m.動態每分次數上限 > 0 && r.次數 >= m.動態每分次數上限) continue;
          if (m.動態每分Token上限 > 0 && r.tokens >= m.動態每分Token上限) continue;
        }

        const capRatio = this.計算剩餘容量比率(m, r, now);
        const 有效分 = m.能力值 * capRatio;

        if (有效分 > 0) {
          candidates.push({ server: s, model: m, 有效分 });
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.有效分 - a.有效分);

    const topN = Math.min(candidates.length, 5);
    const attempted = new Set<number>();

    for (let attempt = 0; attempt < Math.min(MAX_RETRIES, topN); attempt++) {
      const available = candidates
        .slice(0, topN)
        .filter((_, i) => !attempted.has(i));

      if (available.length === 0) break;

      let 隨機值 = Math.random() * available.reduce((s, c) => s + c.有效分, 0);
      let 選中: Candidate | undefined;

      for (let i = 0; i < available.length; i++) {
        const c = available[i];
        const origIdx = candidates.indexOf(c);
        隨機值 -= c.有效分;
        if (隨機值 <= 0) {
          選中 = c;
          attempted.add(origIdx);
          break;
        }
      }

      if (!選中) continue;

      let provider: AIProvider | null = null;
      try {
        provider = await this.建立Provider(選中.server, 選中.model.名稱);
      } catch { continue; }
      if (!provider) continue;

      // 檢查 provider 是否支援聊天含工具
      if (!provider.聊天含工具) continue;

      try {
        選中.model.當前併發數++;
        選中.server.當前總併發++;

        const mergedOptions = { ...options, model: options?.model || 選中.model.名稱 };
        const 回應 = await provider.聊天含工具(系統提示, 對話歷史, 工具定義, mergedOptions);

        this.記錄RPMUsage(選中.server.id, 選中.model.名稱, 回應.token數);
        選中.model.連續成功次數++;
        選中.model.連續失敗次數 = 0;

        return {
          回應,
          serverID: 選中.server.id,
          providerType: 選中.server.provider,
        };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await error('AIPool', `${選中.server.id}/${選中.model.名稱} 請求失敗: ${errMsg}`);

        if (errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('Rate limit')) {
          this.觸發429衰減(選中.server, 選中.model);
        } else {
          選中.model.連續失敗次數++;
          選中.model.連續成功次數 = 0;
          if (選中.model.連續失敗次數 >= FAIL_COOLDOWN_COUNT) {
            選中.model.解禁時間戳 = Date.now() + 選中.model.冷卻秒數 * 1000;
            await info('AIPool', `${選中.server.id}/${選中.model.名稱} 連續失敗 ${FAIL_COOLDOWN_COUNT} 次，冷卻 ${選中.model.冷卻秒數} 秒`);
          }
        }
      } finally {
        選中.model.當前併發數 = Math.max(0, 選中.model.當前併發數 - 1);
        選中.server.當前總併發 = Math.max(0, 選中.server.當前總併發 - 1);
      }
    }

    return null;
  }

  // ═══════════════════════════════════════════
  //  內部：限制檢查與調諧
  // ═══════════════════════════════════════════

  /** 計算剩餘容量比率（越高 = 越不忙） */
  private 計算剩餘容量比率(m: AI模型定義, r: RPM視窗 | undefined, now: number): number {
    let ratio = 1.0;

    // RPM 比率
    if (m.動態每分次數上限 > 0) {
      const used = (r && now - r.視窗時間戳 < 60000) ? r.次數 : 0;
      const remaining = Math.max(0, m.動態每分次數上限 - used);
      ratio *= remaining / m.動態每分次數上限;
    }

    // TPM 比率
    if (m.動態每分Token上限 > 0) {
      const used = (r && now - r.視窗時間戳 < 60000) ? r.tokens : 0;
      const remaining = Math.max(0, m.動態每分Token上限 - used);
      ratio *= remaining / m.動態每分Token上限;
    }

    // 併發比率
    if (m.動態併發數上限 > 0) {
      const remaining = Math.max(0, m.動態併發數上限 - m.當前併發數);
      ratio *= remaining / m.動態併發數上限;
    }

    return ratio;
  }

  /** 429 觸發：乘法衰減動態上限 + 冷卻 */
  private 觸發429衰減(s: AI伺服器, m: AI模型定義): void {
    const now = Date.now();

    // 計算下限：天花板的 20%（避免永久降級），但不小於 1
    const rpmFloor = Math.max(1, Math.round(m.每分次數上限 * 0.2));
    const tpmFloor = Math.max(1, Math.round(m.每分Token上限 * 0.2));
    const concFloor = Math.max(1, Math.round(m.併發數上限 * 0.2));
    const serverConcFloor = Math.max(1, Math.round(s.併發數上限 * 0.2));

    // Model 級：乘上 THROTTLE_RATE（0.85），不得低於下限
    m.動態每分次數上限 = Math.max(rpmFloor, Math.round(m.動態每分次數上限 * THROTTLE_RATE));
    m.動態每分Token上限 = Math.max(tpmFloor, Math.round(m.動態每分Token上限 * THROTTLE_RATE));
    m.動態併發數上限 = Math.max(concFloor, Math.round(m.動態併發數上限 * THROTTLE_RATE));

    // 429 是 provider 端的速率限制，不應歸咎於 model 本身，
    // 因此不重置連續成功計數（保留回升累積進度）。
    // 只重置連續失敗並觸發冷卻。
    m.連續失敗次數 = FAIL_COOLDOWN_COUNT; // 直接觸發冷卻（跳過累積）
    m.解禁時間戳 = now + m.冷卻秒數 * 1000;

    // Server 級也跟着打折
    s.動態全域併發上限 = Math.max(serverConcFloor, Math.round(s.動態全域併發上限 * THROTTLE_RATE));
    s.解禁時間戳 = now + s.冷卻秒數 * 1000;

    info('AIPool', `${s.id}/${m.名稱} 收到 429，動態上限打折至 RPM=${m.動態每分次數上限}/${m.每分次數上限} TPM=${m.動態每分Token上限}/${m.每分Token上限} 並發=${m.動態併發數上限}/${m.併發數上限}，冷卻 ${m.冷卻秒數}s (連續成功=${m.連續成功次數} 保留不歸零)`);
  }

  /** 記錄一次成功請求的用量到 RPM 視窗 */
  private 記錄RPMUsage(serverId: string, modelName: string, token數: number): void {
    const key = `${serverId}::${modelName}`;
    const now = Date.now();
    const r = AIPoolManager.rpmTracker.get(key);

    if (!r || now - r.視窗時間戳 >= 60000) {
      // 新視窗
      AIPoolManager.rpmTracker.set(key, { 次數: 1, tokens: token數, 視窗時間戳: now });
    } else {
      r.次數++;
      r.tokens += token數;
    }
  }

  // ═══════════════════════════════════════════
  //  內部：Provider 建立
  // ═══════════════════════════════════════════

  private async 建立Provider(server: AI伺服器, 模型名稱: string): Promise<AIProvider | null> {
    const p = server.provider.toLowerCase();
    const apiKeyString = await server.apiKey.getPlainText();

    // 查找對應的模型定義
    const modelDef = server.模型列表.find(m => m.名稱 === 模型名稱);
    const 是否為推理模型 = modelDef?.是否為推理模型 ?? false;
    const 預期思考超時秒數 = modelDef?.預期思考超時秒數 ?? 30;

    if (PROVIDER_OPENAI_COMPATIBLE.has(p)) {
      return new OpenAIProvider(apiKeyString, 模型名稱, server.url, 是否為推理模型, 預期思考超時秒數);
    }
    if (PROVIDER_OLLAMA.has(p)) {
      return new OllamaProvider(server.url, 模型名稱, apiKeyString, 是否為推理模型, 預期思考超時秒數);
    }
    if (PROVIDER_ANTHROPIC.has(p)) {
      return new AnthropicProvider(apiKeyString, 模型名稱, 是否為推理模型, 預期思考超時秒數);
    }
    if (PROVIDER_GEMINI.has(p)) {
      return new GeminiProvider(apiKeyString, 模型名稱, 是否為推理模型, 預期思考超時秒數);
    }
    return null;
  }

  // ═══════════════════════════════════════════
  //  內部：工具方法
  // ═══════════════════════════════════════════

  private 檢查有效日期(s: AI伺服器): boolean {
    if (!s.有效日期) return true;
    return new Date(s.有效日期) > new Date();
  }

  private 能力全匹配(擅長: string[], 需求: AI能力[]): boolean {
    if (需求.length === 0) return true;
    const set = new Set(擅長);
    return 需求.every(tag => set.has(tag));
  }

  // ═══════════════════════════════════════════
  //  硬體分數自評
  // ═══════════════════════════════════════════

  public async 檢查並更新硬體分數(): Promise<void> {
    if (AIPoolManager.hwScoreUpdating) return;
    AIPoolManager.hwScoreUpdating = true;

    try {
      const servers = Array.from(AIPoolManager.servers.values());
      const 未評分 = servers.filter(s => s.硬體分數 === 0);
      if (未評分.length === 0) { AIPoolManager.hwScoreUpdating = false; return; }

      const 可用Server = servers.find(s => s.模型列表 && s.模型列表.length > 0);
      if (!可用Server) { AIPoolManager.hwScoreUpdating = false; return; }

      const provider = await this.建立Provider(可用Server, 可用Server.模型列表[0].名稱);
      if (!provider) { AIPoolManager.hwScoreUpdating = false; return; }

      const 硬體列表 = 未評分
        .map(s => `- id: ${s.id}, 硬體: ${s.硬體描述 || '未知'}`)
        .join('\n');

      const prompt = `根據以下 AI Server 硬體規格，為每台 server 的 LLM 推論能力評分 (1-10)：\n考量 CPU 算力、RAM 大小、GPU 有無及 VRAM。\n只回傳 JSON 陣列，不要有任何 Markdown 包裹：[{"id": "server-id", "分數": 8}]\n\n${硬體列表}`;

      const 回應 = await provider.聊天('你是硬體效能分析專家，請嚴格輸出符合規範的 JSON 陣列結構。', [
        { 角色: 'user', 內容: prompt },
      ], { maxTokens: 500, temperature: 0.1 });

      const siteMap = new Map<string, string>();
      const 網站列表 = await 資料池.查詢所有列表<{ id: string; 網域: string }>('網站資訊', 1000, 0);
      if (網站列表.success && 網站列表.data) {
        for (const site of 網站列表.data) {
          const cleanId = site.id.split(':').pop() || site.id;
          siteMap.set(cleanId, site.網域);
          siteMap.set(site.id, site.網域);
        }
      }

      const scores = JSON.parse(回應.內容) as Array<{ id: string; 分數: number }>;
      for (const item of scores) {
        const target = AIPoolManager.servers.get(item.id);
        if (target) {
          target.硬體分數 = item.分數;

          let 目標寫入網域: string = 'SYSTEM';
          if (target.網站ID) {
            const cleanSiteId = target.網站ID.split(':').pop() || target.網站ID;
            目標寫入網域 = siteMap.get(cleanSiteId) || 'SYSTEM';
          }

          await 資料池.創建或更新('AI伺服器', target.toJSON(), 目標寫入網域);
          await info('AIPool', `[硬體動態評分] 伺服器 ${target.名稱} 成功評定為 ${item.分數} 分，並安全儲存至層級 [${目標寫入網域}]。`);
        }
      }
    } catch (err) {
      await error('AIPool', `背景硬體分數更新失敗: ${err}`);
    } finally {
      AIPoolManager.hwScoreUpdating = false;
    }
  }

  // ═══════════════════════════════════════════
  //  API 輸出（不含 apiKey）
  // ═══════════════════════════════════════════

  public static 列出Server() {
    return Array.from(AIPoolManager.servers.values()).map(s => s.toJSON());
  }
}
