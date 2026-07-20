// Gemini Provider — Google Gemini API
// v2: 新增聊天含工具() — Gemini 原生 functionCalling

import { AIProvider, AI聊天訊息, AI回應, AIProviderOptions, ToolDefinition, ToolCall, 過濾思考區塊 } from './adapter.ts';

export class GeminiProvider implements AIProvider {
  readonly 類型 = 'gemini';
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private 是否為推理模型: boolean;
  private 預期思考超時秒數: number;

  constructor(
    apiKey: string, 
    model: string = 'gemini-2.0-flash',
    是否為推理模型: boolean = false,
    預期思考超時秒數: number = 30
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
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
      const body: Record<string, unknown> = {
        system_instruction: { parts: [{ text: 系統提示 }] },
        contents: 對話歷史.map(m => this.轉換訊息(m)),
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.7,
        },
      };

      // 將 OpenAI 格式的 tools 轉換為 Gemini 的 functionDeclarations
      if (工具定義 && 工具定義.length > 0) {
        body.tools = [{
          functionDeclarations: 工具定義.map(t => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
          })),
        }];
        body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
      }

      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(超時毫秒),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API 錯誤 (${response.status}): ${JSON.stringify(errData)}`);
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            role?: string;
            parts?: Array<{
              text?: string;
              functionCall?: { name: string; args: Record<string, unknown> };
            }>;
          };
          finishReason?: string;
        }>;
        usageMetadata?: { totalTokenCount: number };
      };

      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      // 分離文字內容與 function calls
      const 文字片段: string[] = [];
      const toolCalls: ToolCall[] = [];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.text) {
          文字片段.push(part.text);
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `gemini-${crypto.randomUUID().slice(0, 8)}`,
            type: 'function',
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args),
            },
          });
        }
      }

      let 內容 = 文字片段.join('');

      if (this.是否為推理模型 && 內容) {
        內容 = 過濾思考區塊(內容);
      }

      const result: AI回應 = {
        內容,
        token數: data.usageMetadata?.totalTokenCount ?? 0,
        耗時毫秒: Date.now() - 開始時間,
      };

      if (toolCalls.length > 0) {
        result.tool_calls = toolCalls;
      }

      return result;
    } catch (err) {
      throw new Error(`Gemini 請求失敗: ${err}`);
    }
  }

  /**
   * 將內部訊息轉換為 Gemini API 格式
   * Gemini 的 role 只有三種：user、model、function
   * - assistant → model
   * - tool → function
   * 
   * Gemini 的 functionCall 和 functionResponse 用不同的 part 型別：
   * - assistant 的 tool_calls → part.functionCall
   * - tool 的回應 → part.functionResponse
   */
  private 轉換訊息(m: AI聊天訊息): Record<string, unknown> {
    // Gemini 不支援 system 角色在 contents 中 — 已由 system_instruction 處理
    // 若歷史訊息中有 system，降級為 user
    if (m.角色 === 'system') {
      return { role: 'user', parts: [{ text: m.內容 }] };
    }

    // tool 角色 → Gemini function 角色
    if (m.角色 === 'tool') {
      return {
        role: 'function',
        parts: [{
          functionResponse: {
            name: m.name ?? 'unknown',
            response: { result: m.內容 },
          },
        }],
      };
    }

    // assistant 角色（Gemini 叫 model）
    if (m.角色 === 'assistant') {
      const parts: unknown[] = [];

      // 文字內容
      if (m.內容) {
        parts.push({ text: m.內容 });
      }

      // tool_calls → Gemini functionCall 格式
      if (m.tool_calls) {
        for (const tc of m.tool_calls) {
          let args: Record<string, unknown>;
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = {};
          }
          parts.push({
            functionCall: {
              name: tc.function.name,
              args,
            },
          });
        }
      }

      return { role: 'model', parts };
    }

    // user → 直接映射
    return { role: 'user', parts: [{ text: m.內容 }] };
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
