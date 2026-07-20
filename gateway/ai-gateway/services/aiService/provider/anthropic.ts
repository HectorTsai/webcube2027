// Anthropic Provider — Claude API
// v2: 新增聊天含工具() — Anthropic 原生 tool_use

import { AIProvider, AI聊天訊息, AI回應, AIProviderOptions, ToolDefinition, 過濾思考區塊 } from './adapter.ts';

export class AnthropicProvider implements AIProvider {
  readonly 類型 = 'anthropic';
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private 是否為推理模型: boolean;
  private 預期思考超時秒數: number;

  constructor(
    apiKey: string, 
    model: string = 'claude-3-haiku-20240307',
    是否為推理模型: boolean = false,
    預期思考超時秒數: number = 30
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.anthropic.com/v1';
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
    const 超時毫秒 = (options?.timeout ?? this.預期思考超時秒數) * 1000;

    try {
      const messages = 對話歷史.map(m => this.轉換訊息(m));

      const body: Record<string, unknown> = {
        model: options?.model ?? this.model,
        system: 系統提示,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
      };

      // 將 OpenAI 格式的 tools 轉換為 Anthropic 的 tool_use 格式
      if (工具定義 && 工具定義.length > 0) {
        body.tools = 工具定義.map(t => ({
          name: t.function.name,
          description: t.function.description,
          input_schema: t.function.parameters,
        }));
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(超時毫秒),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API 錯誤 (${response.status}): ${JSON.stringify(errData)}`);
      }

      const data = await response.json() as {
        content: Array<{
          type: string;
          text?: string;
          id?: string;
          name?: string;
          input?: Record<string, unknown>;
        }>;
        usage?: { input_tokens: number; output_tokens: number };
      };

      // 分離文字內容與 tool_use 區塊
      const 文字片段: string[] = [];
      const toolCalls: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }> = [];

      for (const c of data.content) {
        if (c.type === 'text' && c.text) {
          文字片段.push(c.text);
        }
        if (c.type === 'tool_use' && c.name) {
          toolCalls.push({
            id: c.id ?? `anthropic-${crypto.randomUUID().slice(0, 8)}`,
            type: 'function',
            function: {
              name: c.name,
              arguments: JSON.stringify(c.input ?? {}),
            },
          });
        }
      }

      let 文字 = 文字片段.join('');

      if (this.是否為推理模型) {
        文字 = 過濾思考區塊(文字);
      }

      const result: AI回應 = {
        內容: 文字,
        token數: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        耗時毫秒: Date.now() - 開始時間,
      };

      if (toolCalls.length > 0) {
        result.tool_calls = toolCalls;
      }

      return result;
    } catch (err) {
      throw new Error(`Anthropic 請求失敗: ${err}`);
    }
  }

  /**
   * 將內部訊息轉換為 Anthropic API 格式
   * Anthropic 的 role: user / assistant
   * tool 訊息用特殊的 content block 格式
   */
  private 轉換訊息(m: AI聊天訊息): Record<string, unknown> {
    // system 角色在歷史中 → 降級為 user
    if (m.角色 === 'system') {
      return { role: 'user', content: m.內容 };
    }

    // tool 角色 → user 角色 + tool_result content block
    if (m.角色 === 'tool') {
      return {
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: m.tool_call_id,
          content: m.內容,
        }],
      };
    }

    // assistant 角色 + tool_calls → Anthropic 的 tool_use 格式
    if (m.角色 === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
      const content: unknown[] = [];
      if (m.內容) {
        content.push({ type: 'text', text: m.內容 });
      }
      for (const tc of m.tool_calls) {
        let input: Record<string, unknown>;
        try {
          input = JSON.parse(tc.function.arguments);
        } catch {
          input = {};
        }
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input,
        });
      }
      return { role: 'assistant', content };
    }

    // 一般訊息
    const role = m.角色 === 'assistant' ? 'assistant' : 'user';
    return { role, content: m.內容 };
  }

  async 檢查可用性(): Promise<boolean> {
    try {
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
