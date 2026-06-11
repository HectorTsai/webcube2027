// AI Pool Manager — Provider 選擇、加權負載均衡、Fallback 鏈
// 這是 AI Service 的核心，所有 AI 請求都透過此模組分派

import { Context } from 'hono';
import { AIProvider, AI聊天訊息, AI回應, AITaskConfig, AI能力 } from './provider/adapter.ts';
import { OpenAIProvider } from './provider/openai.ts';
import { AnthropicProvider } from './provider/anthropic.ts';
import { GeminiProvider } from './provider/gemini.ts';
import { OllamaProvider } from './provider/ollama.ts';
import { info, error } from '../../utils/logger.ts';
import { 資料池 } from '../../database/資料池.ts';
import AI伺服器 from '../../database/models/AI伺服器.ts';

// ── Provider 路由表 ──

const PROVIDER_OPENAI_COMPATIBLE = new Set([
  'openai', 'deepseek', 'groq', 'minmax', 'together', 'lmstudio',
  'azure', 'mistral', 'cohere', 'perplexity',
]);
const PROVIDER_OLLAMA = new Set(['ollama']);
const PROVIDER_ANTHROPIC = new Set(['anthropic']);
const PROVIDER_GEMINI = new Set(['gemini']);

// ── 內部型別 ──

interface PoolModel {
  server: AI伺服器;
  模型名稱: string;
  能力值: number;
  擅長能力: string[];
  提供者: AIProvider | null;
  併發數: number;
}

// ── Pool Manager ──

export class AIPoolManager {
  private static servers: Map<string, AI伺服器> = new Map();
  private static hwScoreUpdating = false;
  private static poolLoaded = false;

  constructor(private c: Context) {}

  /**
   * 執行聊天請求
   * Fallback 鏈: 網站自備(L3) → 系統收費(L2) → 系統免費(L2)
   * 每個階段都做 model 層級 AND 能力匹配 + 加權負載均衡
   */
  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    taskConfig?: AITaskConfig,
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<{ 回應: AI回應; serverID: string; providerType: string }> {
    const 最低能力值 = taskConfig?.最低能力值 ?? 0;
    const 需求能力 = taskConfig?.需求能力 ?? [];
    const 系統資訊 = this.c.get('系統資訊') as Record<string, unknown> | null;

    // 1. 載入 Pool（L2 系統級 + L3 網站自備）
    await this.確保Pool初始化(系統資訊);

    const 全部 = Array.from(AIPoolManager.servers.values())
      .filter(s => s.啟用 && this.檢查有效日期(s));

    // 2. 網站自備 server（L3，排最前面）
    const 網站ID = this.c.get('host') as string;
    const 網站自備 = 全部.filter(s => s.網站ID === 網站ID);
    const result = await this.匹配並執行(網站自備, 最低能力值, 需求能力, 系統提示, 對話歷史, options);
    if (result) return result;

    // 3. 系統級 server（L2，只剩系統級 = 網站ID 為 null）
    const 系統級 = 全部.filter(s => s.網站ID === null);

    // 3a. 收費 server
    const 收費池 = 系統級.filter(s => s.收費);
    const 收費Result = await this.匹配並執行(收費池, 最低能力值, 需求能力, 系統提示, 對話歷史, options);
    if (收費Result) return 收費Result;

    // 3b. 免費 server
    const 免費池 = 系統級.filter(s => !s.收費);
    const 免費Result = await this.匹配並執行(免費池, 最低能力值, 需求能力, 系統提示, 對話歷史, options);
    if (免費Result) return 免費Result;

    // 4. 沒有任何可用的 AI server
    throw new Error('沒有可用的 AI server。請確認系統管理員已設定至少一台 AI server，或網站管理員已設定自備 API key。');
  }

  /**
   * 手動觸發 Pool 載入（供除錯端點使用）
   */
  async 觸發Pool載入(): Promise<void> {
    const 系統資訊 = this.c.get('系統資訊') as Record<string, unknown> | null;
    await this.確保Pool初始化(系統資訊);
  }

  /**
   * 從 L2 + L3 載入所有 server，並做 Provider 初始化
   */
  private async 確保Pool初始化(系統資訊: Record<string, unknown> | null): Promise<void> {
    if (AIPoolManager.poolLoaded) return;

    const 伺服器池 = 系統資訊?.AI伺服器池 as string[] | undefined;

    // L2: 系統級 server（從 系統資訊.AI伺服器池 取得 ID 列表）
    if (伺服器池?.length) {
      for (const serverId of 伺服器池) {
        if (AIPoolManager.servers.has(serverId)) continue;
        try {
          const r = await 資料池.查詢單一<AI伺服器>(serverId);
          if (r.success && r.data) AIPoolManager.servers.set(serverId, r.data);
        } catch (err) {
          await error('AIPool', `載入系統 server ${serverId} 失敗: ${err}`);
        }
      }
    }

    // L3: 網站自備 server（查詢當前租戶的 AI伺服器）
    try {
      const r = await 資料池.查詢列表<AI伺服器>('AI伺服器', 100, 0);
      if (r.success && r.data) {
        for (const s of r.data) {
          if (!AIPoolManager.servers.has(s.id)) {
            AIPoolManager.servers.set(s.id, s);
          }
        }
      }
    } catch { /* L3 可能沒有 AI伺服器 */ }

    AIPoolManager.poolLoaded = true;
  }

  /**
   * 刷新 Pool（新增/刪除 server 後呼叫）
   */
  static 刷新(): void {
    AIPoolManager.servers.clear();
    AIPoolManager.poolLoaded = false;
  }

  /**
   * 列出目前所有已載入的 server 狀態（供除錯用）
   */
  static 列出Server(): Array<{ id: string; 名稱: string; provider: string; 模型數: number; 啟用: boolean; 網站級: boolean }> {
    return Array.from(AIPoolManager.servers.values()).map(s => ({
      id: s.id,
      名稱: s.名稱,
      provider: s.provider,
      模型數: s.模型列表.length,
      啟用: s.啟用,
      網站級: !!s.網站ID,
    }));
  }

  /**
   * 檢查 server 有效日期是否仍有效
   */
  private 檢查有效日期(s: AI伺服器): boolean {
    if (!s.有效日期) return true; // null = 永久
    return new Date(s.有效日期) > new Date();
  }

  /**
   * 核心匹配邏輯：從 server 列表中找出滿足能力的 model，加權隨機選擇執行
   * AND 匹配：需求能力必須全部是 model 擅長能力的子集
   */
  private async 匹配並執行(
    servers: AI伺服器[],
    最低能力值: number,
    需求能力: AI能力[],
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<{ 回應: AI回應; serverID: string; providerType: string } | null> {
    // 1. 從所有 server 的模型列表中篩選合格 model
    const 合格Models: PoolModel[] = [];

    for (const s of servers) {
      for (const m of s.模型列表) {
        if (m.能力值 < 最低能力值) continue;
        if (!this.能力全匹配(m.擅長能力, 需求能力)) continue;

        合格Models.push({
          server: s,
          模型名稱: m.名稱,
          能力值: m.能力值,
          擅長能力: m.擅長能力,
          提供者: null,
          併發數: 0,
        });
      }
    }

    if (合格Models.length === 0) return null;

    // 2. 計算有效分數 = 能力值 / (併發數 + 1)，加權隨機挑選（最多重試 3 次）
    const attempted = new Set<number>();

    for (let attempt = 0; attempt < Math.min(3, 合格Models.length); attempt++) {
      const available = 合格Models.filter((_, i) => !attempted.has(i));
      if (available.length === 0) break;

      let 總有效分 = 0;
      for (const m of available) {
        總有效分 += m.能力值 / (m.併發數 + 1);
      }
      if (總有效分 === 0) break;

      let 隨機值 = Math.random() * 總有效分;
      let 選中: PoolModel | null = null;
      let 選中Index = -1;

      for (let i = 0; i < 合格Models.length; i++) {
        if (attempted.has(i)) continue;
        const m = 合格Models[i];
        隨機值 -= m.能力值 / (m.併發數 + 1);
        if (隨機值 <= 0) {
          選中 = m;
          選中Index = i;
          break;
        }
      }

      if (!選中 || 選中Index < 0) continue;
      attempted.add(選中Index);

      // 3. 建立 / 重用 provider
      if (!選中.提供者) {
        try {
          選中.提供者 = await this.建立Provider(選中.server, 選中.模型名稱);
        } catch {
          continue;
        }
      }
      if (!選中.提供者) continue;

      // 4. 執行請求
      try {
        選中.併發數++;
        const mergedOptions = { ...options, model: options?.model || 選中.模型名稱 };
        const 回應 = await 選中.提供者.聊天(系統提示, 對話歷史, mergedOptions);
        return {
          回應,
          serverID: 選中.server.id,
          providerType: 選中.server.provider,
        };
      } catch (err) {
        await error('AIPool', `${選中.server.id}/${選中.模型名稱} 請求失敗: ${err}`);
        選中.提供者 = null;
      } finally {
        選中.併發數 = Math.max(0, 選中.併發數 - 1);
      }
    }

    return null;
  }

  /**
   * AND 匹配：需求能力 必須全部是 擅長能力 的子集
   */
  private 能力全匹配(擅長: string[], 需求: AI能力[]): boolean {
    if (需求.length === 0) return true;
    const set = new Set(擅長);
    return 需求.every(tag => set.has(tag));
  }

  /**
   * Provider 路由表 — 根據 provider 字串決定使用哪個 class
   */
  private async 建立Provider(s: AI伺服器, model: string): Promise<AIProvider | null> {
    if (PROVIDER_OPENAI_COMPATIBLE.has(s.provider)) {
      const baseUrl = s.provider === 'deepseek' ? 'https://api.deepseek.com/v1'
        : s.provider === 'groq' ? 'https://api.groq.com/openai/v1'
        : s.provider === 'minmax' ? 'https://api.minimax.chat/v1'
        : s.provider === 'together' ? 'https://api.together.xyz/v1'
        : s.provider === 'mistral' ? 'https://api.mistral.ai/v1'
        : s.url;
      const key = await s.apiKey.getPlainText();
      return key ? new OpenAIProvider(key, model, baseUrl) : null;
    }

    if (PROVIDER_OLLAMA.has(s.provider)) {
      const key = await s.apiKey.getPlainText();
      return new OllamaProvider(s.url, model, key) as AIProvider;
    }

    if (PROVIDER_ANTHROPIC.has(s.provider)) {
      const key = await s.apiKey.getPlainText();
      return key ? new AnthropicProvider(key, model) : null;
    }

    if (PROVIDER_GEMINI.has(s.provider)) {
      const key = await s.apiKey.getPlainText();
      return key ? new GeminiProvider(key, model) : null;
    }

    // 未知 provider → fallback OpenAI-compatible
    const key = await s.apiKey.getPlainText();
    return key ? new OpenAIProvider(key, model, s.url) : null;
  }

  /**
   * 使用 AI 重新評估所有 server 的硬體分數（新增/變更 server 後呼叫）
   */
  async 更新硬體分數(): Promise<void> {
    if (AIPoolManager.hwScoreUpdating) return;
    AIPoolManager.hwScoreUpdating = true;

    try {
      const servers = Array.from(AIPoolManager.servers.values());
      const 未評分 = servers.filter(s => s.硬體分數 === 0);
      if (未評分.length === 0) { AIPoolManager.hwScoreUpdating = false; return; }

      // 用任一可用 server 做硬體評分
      const 可用Server = servers.find(s => s.模型列表.length > 0);
      if (!可用Server) { AIPoolManager.hwScoreUpdating = false; return; }
      const provider = await this.建立Provider(可用Server, 可用Server.模型列表[0].名稱);
      if (!provider) { AIPoolManager.hwScoreUpdating = false; return; }

      const 硬體列表 = 未評分
        .map(s => `- id: ${s.id}, 硬體: ${s.硬體描述 || '未知'}`)
        .join('\n');

      const prompt = `根據以下 AI Server 硬體規格，為每台 server 的 LLM 推論能力評分 (1-10)：
考量 CPU 算力、RAM 大小、GPU 有無及 VRAM。
只回傳 JSON 陣列：[{id: "server-id", 分數: 8}]

${硬體列表}`;

      const 回應 = await provider.聊天('你是硬體效能分析專家', [
        { 角色: 'user', 內容: prompt },
      ], { maxTokens: 500, temperature: 0.1 });

      const jsonMatch = 回應.內容.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]) as Array<{ id: string; 分數: number }>;
        for (const { id, 分數 } of scores) {
          const s = AIPoolManager.servers.get(id);
          if (s) { s.硬體分數 = 分數; await info('AIPool', `${id} 硬體分數: ${分數}`); }
        }
      }
    } catch (err) {
      await error('AIPool', `更新硬體分數失敗: ${err}`);
    } finally {
      AIPoolManager.hwScoreUpdating = false;
    }
  }
}
