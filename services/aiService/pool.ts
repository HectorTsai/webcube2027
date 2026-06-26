// AI Pool Manager — Provider 選擇、加權負載均衡、Fallback 鏈
// 這是 AI Service 的核心，所有 AI 請求都透過此模組分派

import { Context } from 'hono';
import { AIProvider, AI聊天訊息, AI回應 } from './provider/adapter.ts';
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

// ── 內部模型調度介面 ──

interface PoolModel {
  server: AI伺服器;
  模型名稱: string;
  能力值: number;
  擅長能力: string[];
  提供者: AIProvider | null;
  併發數: number;
}

export class AIPoolManager {
  private ctx?: Context;
  
  // 長駐記憶體快取：共享所有連線狀態
  public static poolLoaded = false;
  public static servers = new Map<string, AI伺服器>();
  public static hwScoreUpdating = false;
  private static checkIntervalStarted = false;

  constructor(c?: Context) {
    this.ctx = c;
    
    // 啟動背景監控與硬體動態評分（確保全域只啟動一個定時器）
    if (!AIPoolManager.checkIntervalStarted) {
      AIPoolManager.checkIntervalStarted = true;
      setInterval(() => this.檢查並更新硬體分數(), 60000); // 每分鐘自動巡檢
    }
  }

  /**
   * 初始化與資料庫長駐加載：確保多個並行連線共享同一個記憶體實例狀態
   */
  public async 觸發Pool載入(): Promise<void> {
    if (AIPoolManager.poolLoaded) return;

    // 🟢 修正 1：直接使用 查詢所有列表，且型別直接為 <AI伺服器>
    // 資料池內部已經動態載入並執行 new AI伺服器(row)，不需也不可在此重複 new
    const result = await 資料池.查詢所有列表<AI伺服器>('AI伺服器', 100, 0);
    const servers = result.data ?? [];

    for (const serverInstance of servers) {
      // 執行實例層級的初始化（例如處理密文 apiKey 解密）
      await serverInstance.初始化();
      
      // 若記憶體快取尚未追蹤該 ID，則塞入長駐 Map
      if (!AIPoolManager.servers.has(serverInstance.id)) {
        AIPoolManager.servers.set(serverInstance.id, serverInstance);
      }
    }
    
    AIPoolManager.poolLoaded = true;
    await info('AIPool', `[初始化] 成功加載 ${AIPoolManager.servers.size} 台 AI 伺服器進入記憶體自適應調度池。`);
  }

  /**
   * 背景自適應評分：掃描未評分 (0分) 的伺服器，利用 LLM 自評並精準回寫對應層級 DB
   */
  public async 檢查並更新硬體分數(): Promise<void> {
    if (AIPoolManager.hwScoreUpdating) return;
    AIPoolManager.hwScoreUpdating = true;

    try {
      const servers = Array.from(AIPoolManager.servers.values());
      const 未評分 = servers.filter(s => s.硬體分數 === 0);
      if (未評分.length === 0) { AIPoolManager.hwScoreUpdating = false; return; }

      // 尋找任一有綁定模型的可用伺服器作為本次評分的推論執行器
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

      // ═══════════════════════════════════════════
      // 🟢 修正 2 & 多租戶安全隔離回寫核心
      // ═══════════════════════════════════════════
      
      // 1. 先向資料池 L2 撈取所有「網站資訊」，動態建立 網站ID -> 網域 (host) 的對照對應表
      const siteMap = new Map<string, string>();
      const 網站列表 = await 資料池.查詢所有列表<{ id: string; 網域: string }>('網站資訊', 1000, 0);
      if (網站列表.success && 網站列表.data) {
        for (const site of 網站列表.data) {
          const cleanId = site.id.split(':').pop() || site.id;
          siteMap.set(cleanId, site.網域);
          siteMap.set(site.id, site.網域); // 雙重防呆
        }
      }

      // 2. 解析 AI 回傳的分數並執行寫回
      const scores = JSON.parse(回應.內容) as Array<{ id: string; 分數: number }>;
      for (const item of scores) {
        const target = AIPoolManager.servers.get(item.id);
        if (target) {
          target.硬體分數 = item.分數;

          // 3. 判斷精準路由網域：
          // - 若為 L1 種子或 L2 系統公用：target.網站ID 為空 -> 寫入 "SYSTEM" (會觸發資料池自動在 L2 創建/遮蔽 L1)
          // - 若為 L3 租戶自備 Key：target.網站ID 有值 -> 從對照表找出其註冊的域名，精準寫回 L3 獨立 DB
          let 目標寫入網域: string = 'SYSTEM';
          if (target.網站ID) {
            const cleanSiteId = target.網站ID.split(':').pop() || target.網站ID;
            目標寫入網域 = siteMap.get(cleanSiteId) || 'SYSTEM';
          }

          // 4. 改用符合規格的「創建或更新」API，並帶入對應層級的目標網域，完美達成隔離
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

  /**
   * 根據伺服器定義動態產生實體 Provider 介面
   */
  private async 建立Provider(server: AI伺服器, 模型名稱: string): Promise<AIProvider | null> {
    const p = server.provider.toLowerCase();
    const apiKeyString = await server.apiKey.getPlainText(); // 從密文字串取真實解密值

    if (PROVIDER_OPENAI_COMPATIBLE.has(p)) {
      return new OpenAIProvider(server.url, apiKeyString);
    }
    if (PROVIDER_OLLAMA.has(p)) {
      return new OllamaProvider(server.url);
    }
    if (PROVIDER_ANTHROPIC.has(p)) {
      return new AnthropicProvider(apiKeyString);
    }
    if (PROVIDER_GEMINI.has(p)) {
      return new GeminiProvider(apiKeyString);
    }
    return null;
  }

  /**
   * Hono Router 控制器使用的 API：回傳目前調度池中所有伺服器的狀態快取
   */
  public static 列出Server() {
    return Array.from(AIPoolManager.servers.values()).map(s => s.toJSON());
  }
}
