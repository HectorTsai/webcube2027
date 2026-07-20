// AI Tool Registry — 工具註冊中心
//
// 職責：
// 1. 註冊所有 AI 可調用的工具（各 generator 的生成函數）
// 2. 提供工具清單給提示詞組合器，讓 AI 知道可用工具
// 3. 執行 AI 請求的工具調用
//
// 設計原則：
// - 新增金剛模組只需 register(tool定義)，ThemeGenerator 零改動
// - 工具定義使用 OpenAI function calling 格式（adapter 層統一標準）
// - 每個 tool 自行處理錯誤、回傳標準化結果

import { ToolDefinition } from '../services/aiService/provider/adapter.ts';

// ── 工具執行結果 ──

export interface Tool執行結果 {
  /** 工具名稱 */
  工具名稱: string;
  /** 是否成功 */
  成功: boolean;
  /** 成功時的回傳資料（會序列化為 JSON 餵回 AI） */
  資料?: Record<string, unknown>;
  /** 失敗時的錯誤訊息（會餵回 AI 讓它修正參數重試） */
  錯誤?: string;
}

// ── 工具定義（內部使用） ──

export interface 已註冊工具 {
  /** 給 AI 看的定義（OpenAI function calling 格式） */
  定義: ToolDefinition;
  /** 執行函數 */
  執行: (參數: Record<string, unknown>) => Promise<Tool執行結果>;
}

// ── Tool Registry ──

class AIToolRegistry {
  private tools: Map<string, 已註冊工具> = new Map();

  /**
   * 註冊一個工具
   * 
   * @example
   * ToolRegistry.register({
   *   名稱: 'generate_color',
   *   描述: '生成新的配色方案（OKLCH 格式 9 色值）',
   *   參數: {
   *     描述: { type: 'string', description: '配色需求描述，如「深咖啡色系」' },
   *   },
   *   必填: ['描述'],
   *   執行: async (args) => { ... }
   * });
   */
  register(config: {
    名稱: string;
    描述: string;
    參數: Record<string, { type: string; description: string; enum?: string[] }>;
    必填: string[];
    執行: (參數: Record<string, unknown>) => Promise<Tool執行結果>;
  }): void {
    const 定義: ToolDefinition = {
      type: 'function',
      function: {
        name: config.名稱,
        description: config.描述,
        parameters: {
          type: 'object',
          properties: config.參數,
          required: config.必填,
        },
      },
    };

    this.tools.set(config.名稱, {
      定義,
      執行: config.執行,
    });
  }

  /** 取得所有已註冊工具（給 AI 看的定義清單） */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.定義);
  }

  /** 根據名稱尋找工具 */
  find(名稱: string): 已註冊工具 | undefined {
    return this.tools.get(名稱);
  }

  /** 執行指定工具 */
  async execute(名稱: string, 參數: Record<string, unknown>): Promise<Tool執行結果> {
    const tool = this.tools.get(名稱);
    if (!tool) {
      return {
        工具名稱: 名稱,
        成功: false,
        錯誤: `未知工具: ${名稱}`,
      };
    }

    try {
      return await tool.執行(參數);
    } catch (err) {
      return {
        工具名稱: 名稱,
        成功: false,
        錯誤: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** 工具總數 */
  get 數量(): number {
    return this.tools.size;
  }
}

// ── 全域單例 ──

export const ToolRegistry = new AIToolRegistry();
