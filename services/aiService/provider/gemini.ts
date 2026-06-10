// Gemini Provider — Google Gemini API

import { AIProvider, AI聊天訊息, AI回應 } from './adapter.ts';

export class GeminiProvider implements AIProvider {
  readonly 類型 = 'gemini';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<AI回應> {
    const 開始時間 = Date.now();
    const model = options?.model ?? this.model;

    try {
      // Gemini 格式：合併 system prompt 到第一則 user 訊息
      const contents = [
        ...對話歷史.map(m => ({
          role: m.角色 === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.內容 }],
        })),
      ];

      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: 系統提示 }] },
            contents,
            generationConfig: {
              maxOutputTokens: options?.maxTokens ?? 1024,
              temperature: options?.temperature ?? 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API 錯誤 (${response.status}): ${JSON.stringify(errData)}`);
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: { parts?: Array<{ text: string }> };
        }>;
        usageMetadata?: { totalTokenCount: number };
      };

      const 文字 = data.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join('') ?? '';

      return {
        內容: 文字,
        token數: data.usageMetadata?.totalTokenCount ?? 0,
        耗時毫秒: Date.now() - 開始時間,
      };
    } catch (err) {
      throw new Error(`Gemini 請求失敗: ${err}`);
    }
  }

  async 檢查可用性(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}?key=${this.apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
