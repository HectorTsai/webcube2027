// AI Provider 統一介面
// 所有 provider（ollama/openai/anthropic/gemini）都實作此介面

export interface AI聊天訊息 {
  角色: "system" | "user" | "assistant";
  內容: string;
}

export interface AI回應 {
  內容: string;
  token數: number;
  耗時毫秒: number;
}

export interface AIProvider {
  /** provider 類型識別 */
  readonly 類型: string;

  /** 同步對話（單次請求） */
  聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<AI回應>;

  /** 串流對話（回傳 async iterable） */
  串流聊天?(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): AsyncIterable<string>;

  /** 檢查 provider 是否可用 */
  檢查可用性(): Promise<boolean>;
}

// ── AI 能力標籤（14 個）──

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
} as const;

export type AI能力 = (typeof AI能力標籤)[keyof typeof AI能力標籤];

// ── Task 能力需求 ──

/** 每個 Task 宣告自身需求，Pool 據此篩選 server 中的 model */
export interface AITaskConfig {
  類型: string;
  最低能力值: number;       // model 能力值需 >= 此值
  需求能力: AI能力[];       // model 擅長能力需全部包含（AND 匹配）
}
