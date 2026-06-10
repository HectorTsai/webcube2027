// Transformer.js Provider — Server 端 WASM 推理
// 使用 @huggingface/transformers，CPU 模式，作為最終 fallback

import { AIProvider, AI聊天訊息, AI回應 } from './adapter.ts';

export class TransformerProvider implements AIProvider {
  readonly 類型 = 'transformer';
  private model: string;
  private generator: unknown = null;

  constructor(model: string = 'onnx-community/Qwen2.5-1.5B-Instruct') {
    this.model = model;
  }

  async 聊天(
    系統提示: string,
    對話歷史: AI聊天訊息[],
    _options?: { model?: string; maxTokens?: number; temperature?: number }
  ): Promise<AI回應> {
    const 開始時間 = Date.now();

    try {
      if (!this.generator) {
        const { pipeline } = await import('@huggingface/transformers');
        this.generator = await pipeline('text-generation', this.model);
      }

      const 訊息 = 對話歷史.map(m => `${m.角色}: ${m.內容}`).join('\n');
      const prompt = `${系統提示}\n\n${訊息}\nassistant:`;

      const result = await (this.generator as Function)(prompt, {
        max_new_tokens: _options?.maxTokens ?? 256,
        temperature: _options?.temperature ?? 0.7,
      });

      const 文字 = (result as Array<{ generated_text: string }>)[0]?.generated_text ?? '';
      const 回應文字 = 文字.includes('assistant:')
        ? 文字.split('assistant:').pop()?.trim() ?? 文字
        : 文字;

      return {
        內容: 回應文字,
        token數: 0,
        耗時毫秒: Date.now() - 開始時間,
      };
    } catch (err) {
      throw new Error(`Transformer 推理失敗: ${err}`);
    }
  }

  async 檢查可用性(): Promise<boolean> {
    try {
      await import('@huggingface/transformers');
      return true;
    } catch {
      return false;
    }
  }
}
