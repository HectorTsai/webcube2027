// Ollama Provider — 透過 HTTP API 呼叫自架 Ollama server

import { AIProvider, AI聊天訊息, AI回應 } from './adapter.ts';

export class OllamaProvider implements AIProvider {
  readonly 類型 = 'ollama';
  private url: string;
  private model: string;
  private apiKey: string;

  constructor(url: string, model: string = 'llama3', apiKey: string = '') {
    this.url = url.replace(/\/$/, '');
    this.model = model;
    this.apiKey = apiKey;
  }

  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<AI回應> {
    const 開始時間 = Date.now();
    const model = options?.model ?? this.model;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      const response = await fetch(`${this.url}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 系統提示 },
            ...對話歷史.map(m => ({
              role: m.角色,
              content: m.內容,
            })),
          ],
          stream: false,
          options: {
            num_predict: options?.maxTokens,
            temperature: options?.temperature ?? 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API 錯誤 (${response.status}): ${errText}`);
      }

      const data = await response.json() as {
        message: { content: string };
        eval_count?: number;
      };

      return {
        內容: data.message.content,
        token數: data.eval_count ?? 0,
        耗時毫秒: Date.now() - 開始時間,
      };
    } catch (err) {
      throw new Error(`Ollama 請求失敗: ${err}`);
    }
  }

  async 檢查可用性(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      const response = await fetch(`${this.url}/api/tags`, {
        headers,
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
