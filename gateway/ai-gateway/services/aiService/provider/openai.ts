// OpenAI Provider — 兼容 OpenAI Chat Completions API
// 支援任何 OpenAI-compatible API (OpenAI / Azure / DeepSeek / Groq / 第三方代理)
// v2: 新增聊天含工具() — 原生 OpenAI function calling

import { AIProvider, AI聊天訊息, AI回應, AIProviderOptions, ToolDefinition, 過濾思考區塊 } from './adapter.ts';

export class OpenAIProvider implements AIProvider {
  readonly 類型 = 'openai';
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private 是否為推理模型: boolean;
  private 預期思考超時秒數: number;

  constructor(
    apiKey: string, 
    model: string = 'gpt-4o-mini', 
    baseUrl: string = 'https://api.openai.com/v1',
    是否為推理模型: boolean = false,
    預期思考超時秒數: number = 30
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, '');
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

  /** 統一的請求發送邏輯（聊天 與 聊天含工具 共用） */
  private async 發送請求(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    工具定義?: ToolDefinition[],
    options?: AIProviderOptions
  ): Promise<AI回應> {
    const 開始時間 = Date.now();
    const 超時毫秒 = (options?.timeout ?? this.預期思考超時秒數) * 1000;

    try {
      const body: Record<string, unknown> = {
        model: options?.model ?? this.model,
        messages: [
          { role: 'system', content: 系統提示 },
          ...對話歷史.map(m => this.轉換訊息(m)),
        ],
        max_tokens: options?.maxTokens,
        temperature: options?.temperature ?? 0.7,
      };

      if (工具定義 && 工具定義.length > 0) {
        body.tools = 工具定義;
        body.tool_choice = 'auto';
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(超時毫秒),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API 錯誤 (${response.status}): ${JSON.stringify(errData)}`);
      }

      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string | null;
            tool_calls?: Array<{
              id: string;
              type: 'function';
              function: { name: string; arguments: string };
            }>;
          };
          finish_reason: string;
        }>;
        usage?: { total_tokens: number };
      };

      const choice = data.choices[0];
      let 內容 = choice?.message?.content ?? '';

      if (this.是否為推理模型 && 內容) {
        內容 = 過濾思考區塊(內容);
      }

      const result: AI回應 = {
        內容,
        token數: data.usage?.total_tokens ?? 0,
        耗時毫秒: Date.now() - 開始時間,
      };

      // 解析 tool_calls
      if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
        result.tool_calls = choice.message.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }));
      }

      return result;
    } catch (err) {
      throw new Error(`OpenAI 請求失敗: ${err}`);
    }
  }

  /** 將內部訊息轉換為 OpenAI API 格式 */
  private 轉換訊息(m: AI聊天訊息): Record<string, unknown> {
    const msg: Record<string, unknown> = {
      role: m.角色,
      content: m.內容 || '',
    };

    if (m.tool_calls) {
      msg.tool_calls = m.tool_calls;
    }
    if (m.tool_call_id) {
      msg.tool_call_id = m.tool_call_id;
    }
    if (m.name) {
      msg.name = m.name;
    }

    return msg;
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
