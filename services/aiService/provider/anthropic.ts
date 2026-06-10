// Anthropic Provider — Claude API

import { AIProvider, AI聊天訊息, AI回應 } from './adapter.ts';

export class AnthropicProvider implements AIProvider {
  readonly 類型 = 'anthropic';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<AI回應> {
    const 開始時間 = Date.now();

    try {
      // Anthropic API 使用 messages + system 分離格式
      const messages = 對話歷史.map(m => ({
        role: m.角色 === 'assistant' ? 'assistant' : 'user',
        content: m.內容,
      }));

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options?.model ?? this.model,
          system: 系統提示,
          messages,
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API 錯誤 (${response.status}): ${JSON.stringify(errData)}`);
      }

      const data = await response.json() as {
        content: Array<{ type: string; text: string }>;
        usage?: { input_tokens: number; output_tokens: number };
      };

      const 文字 = data.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('');

      return {
        內容: 文字,
        token數: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        耗時毫秒: Date.now() - 開始時間,
      };
    } catch (err) {
      throw new Error(`Anthropic 請求失敗: ${err}`);
    }
  }

  async 檢查可用性(): Promise<boolean> {
    try {
      // Anthropic 沒有 models 端點，用簡單請求測試
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
