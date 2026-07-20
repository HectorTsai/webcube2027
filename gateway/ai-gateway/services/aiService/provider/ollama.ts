// Ollama Provider — 透過 HTTP API 呼叫自架 Ollama server
// v2: 新增聊天含工具() — Ollama v0.3+ 支援 OpenAI 相容的 tools API

import { AIProvider, AI聊天訊息, AI回應, AIProviderOptions, ToolDefinition, 過濾思考區塊 } from './adapter.ts';

export class OllamaProvider implements AIProvider {
  readonly 類型 = 'ollama';
  private url: string;
  private model: string;
  private apiKey: string;
  private 是否為推理模型: boolean;
  private 預期思考超時秒數: number;

  constructor(
    url: string,
    model: string = 'llama3',
    apiKey: string = '',
    是否為推理模型: boolean = false,
    預期思考超時秒數: number = 30
  ) {
    this.url = url.replace(/\/$/, '');
    this.model = model;
    this.apiKey = apiKey;
    this.是否為推理模型 = 是否為推理模型;
    this.預期思考超時秒數 = 預期思考超時秒數;
  }

  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    options?: AIProviderOptions
  ): Promise<AI回應> {
    return this.發送請求(系統提示, 對話歷史, undefined, options);
  }

  async 聊天含工具(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    工具定義: ToolDefinition[],
    options?: AIProviderOptions
  ): Promise<AI回應> {
    return this.發送請求(系統提示, 對話歷史, 工具定義, options);
  }

  private async 發送請求(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    工具定義?: ToolDefinition[],
    options?: AIProviderOptions
  ): Promise<AI回應> {
    const 開始時間 = Date.now();
    const model = options?.model ?? this.model;
    const 超時毫秒 = (options?.timeout ?? this.預期思考超時秒數) * 1000;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const body: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: 系統提示 },
          ...對話歷史.map(m => this.轉換訊息(m)),
        ],
        stream: false,
        options: {
          num_predict: options?.maxTokens,
          temperature: options?.temperature ?? 0.7,
        },
      };

      if (工具定義 && 工具定義.length > 0) {
        body.tools = 工具定義;
      }

      const response = await fetch(`${this.url}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(超時毫秒),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API 錯誤 (${response.status}): ${errText}`);
      }

      const data = await response.json() as {
        message: {
          content: string;
          tool_calls?: Array<{
            function: { name: string; arguments: Record<string, unknown> | string };
          }>;
        };
        eval_count?: number;
      };

      let 內容 = data.message.content ?? '';

      if (this.是否為推理模型 && 內容) {
        內容 = 過濾思考區塊(內容);
      }

      const result: AI回應 = {
        內容,
        token數: data.eval_count ?? 0,
        耗時毫秒: Date.now() - 開始時間,
      };

      // Ollama 的 tool_calls 格式略有不同，需標準化
      if (data.message.tool_calls && data.message.tool_calls.length > 0) {
        result.tool_calls = data.message.tool_calls.map(tc => ({
          id: `ollama-${crypto.randomUUID().slice(0, 8)}`,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: typeof tc.function.arguments === 'string'
              ? tc.function.arguments
              : JSON.stringify(tc.function.arguments),
          },
        }));
      }

      return result;
    } catch (err) {
      throw new Error(`Ollama 請求失敗: ${err}`);
    }
  }

  /** 將內部訊息轉換為 Ollama API 格式 */
  private 轉換訊息(m: AI聊天訊息): Record<string, unknown> {
    const msg: Record<string, unknown> = {
      role: m.角色 === 'tool' ? 'tool' : m.角色,
      content: m.內容 || '',
    };

    if (m.tool_calls) {
      msg.tool_calls = m.tool_calls;
    }
    if (m.tool_call_id) {
      msg.tool_call_id = m.tool_call_id;
    }

    return msg;
  }

  async 檢查可用性(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      const response = await fetch(`${this.url}/api/tags`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
