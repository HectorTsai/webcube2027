// OpenAI Provider — 兼容 OpenAI Chat Completions API
// 支援任何 OpenAI-compatible API (OpenAI / Azure / 第三方代理)

import { AIProvider, AI聊天訊息, AI回應 } from './adapter.ts';

export class OpenAIProvider implements AIProvider {
  readonly 類型 = 'openai';
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini', baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<AI回應> {
    const 開始時間 = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options?.model ?? this.model,
          messages: [
            { role: 'system', content: 系統提示 },
            ...對話歷史.map(m => ({
              role: m.角色,
              content: m.內容,
            })),
          ],
          max_tokens: options?.maxTokens,
          temperature: options?.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API 錯誤 (${response.status}): ${JSON.stringify(errData)}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { total_tokens: number };
      };

      return {
        內容: data.choices[0]?.message?.content ?? '',
        token數: data.usage?.total_tokens ?? 0,
        耗時毫秒: Date.now() - 開始時間,
      };
    } catch (err) {
      throw new Error(`OpenAI 請求失敗: ${err}`);
    }
  }

  async 檢查可用性(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
