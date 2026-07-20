// AI Provider 統一介面
// 所有 provider（ollama/openai/anthropic/gemini）都實作此介面
//
// v2: 新增工具調用（function calling）支援
//   - ToolDefinition：工具定義（OpenAI 相容格式，各 provider 自行轉換）
//   - ToolCall：AI 回傳的工具調用請求
//   - AI聊天訊息.角色 擴充 'tool'（工具執行結果回傳）
//   - AIProvider.聊天含工具()：可選方法，支援工具調用的 provider 實作

// ── 工具調用（Function Calling）型別定義 ──

/** OpenAI 相容的工具定義 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

/** AI 回傳的工具調用請求 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON 字串
  };
}

// ── 訊息與回應型別 ──

export interface AI聊天訊息 {
  角色: "system" | "user" | "assistant" | "tool";
  內容: string;
  /** assistant 訊息可攜帶 tool_calls */
  tool_calls?: ToolCall[];
  /** tool 訊息需攜帶對應的 tool_call_id */
  tool_call_id?: string;
  /** tool 訊息可攜帶工具名稱（選填，部分 provider 需要） */
  name?: string;
}

export interface AI回應 {
  內容: string;
  token數: number;
  耗時毫秒: number;
  /** AI 可能直接回傳 tool_calls 而非文字內容 */
  tool_calls?: ToolCall[];
}

export interface AIProviderOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

// ── Provider 介面（v2：新增聊天含工具） ──

export interface AIProvider {
  /** provider 類型識別 */
  readonly 類型: string;

  /** 同步對話（單次請求，不含工具） */
  聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: AIProviderOptions
  ): Promise<AI回應>;

  /**
   * 同步對話（含工具定義）
   * 支援 function calling 的 provider 實作此方法。
   * 若 provider 不支援，pool manager 不會選用於需要工具調用的 task。
   */
  聊天含工具?(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    工具定義: ToolDefinition[],
    options?: AIProviderOptions
  ): Promise<AI回應>;

  /** 串流對話（回傳 async iterable） */
  串流聊天?(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: AIProviderOptions
  ): AsyncIterable<string>;

  /** 檢查 provider 是否可用 */
  檢查可用性(): Promise<boolean>;
}

/**
 * 過濾思考區塊的通用工具函數
 * 用於移除 AI 模型輸出中的 <think>...</think> 標籤
 */
export function 過濾思考區塊(內容: string): string {
  let 結果 = 內容;
  let 上次長度;
  do {
    上次長度 = 結果.length;
    結果 = 結果.replace(/<think>[\s\S]*?<\/think>/gi, '');
  } while (結果.length !== 上次長度);
  
  return 結果.trim().replace(/\n\s*\n\s*\n/g, '\n\n');
}

// ── AI 能力標籤（15 個）──

export const AI能力標籤 = {
  文本生成: '文本生成',
  翻譯: '翻譯',
  代碼生成: '代碼生成',
  CSS與設計: 'CSS與設計',
  結構化輸出: '結構化輸出',
  多語言: '多語言',
  嵌入: '嵌入',
  工具調用: '工具調用',
  // 擴充（未來使用）
  圖片生成: '圖片生成',
  圖片理解: '圖片理解',
  影片生成: '影片生成',
  語音合成: '語音合成',
  語音辨識: '語音辨識',
  推理: '推理',
  代碼審核: '代碼審核',
} as const;

export type AI能力 = (typeof AI能力標籤)[keyof typeof AI能力標籤];

// ── Task 能力需求 ──

/** 每個 Task 宣告自身需求，Pool 據此篩選 server 中的 model */
export interface AITaskConfig {
  類型: string;
  最低能力值: number;       // model 能力值需 >= 此值
  需求能力: AI能力[];       // model 擅長能力需全部包含（AND 匹配）
}
