// 翻譯 Task — AI 接手多國語言翻譯，Google Translate 作為 fallback
// 對 ≤ 60 bytes 的文字，先查單字快取，翻譯後回存

import { Context } from 'hono';
import { getTranslation } from '@dui/smartmultilingual';
import { AIPoolManager } from '../pool.ts';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import { 查詢翻譯快取, 寫入翻譯快取 } from '../翻譯快取.ts';
import { error, info } from '../../../utils/logger.ts';

export const TRANSLATE_TASK_CONFIG: AITaskConfig = {
  類型: '翻譯',
  最低能力值: 0,
  需求能力: [AI能力標籤.翻譯, AI能力標籤.多語言],
};

const PROMPT = `你是翻譯專家。只回傳 JSON，不要任何其他文字。
格式：{ "語言代碼": "翻譯結果" }
保持原文標記符號不變。`;

export class Translator {
  constructor(private c: Context) {}

  async 翻譯(text: string, sourceLang: string, targetLangs: string[]): Promise<Record<string, string>> {
    // 1. 查快取
    const cached = await 查詢翻譯快取(sourceLang, text, targetLangs);
    if (cached) {
      await info('Translator', `快取命中: ${sourceLang} → ${targetLangs.join(',')} "${text.slice(0, 30)}"`);
      return cached;
    }

    // 2. AI / Google 翻譯
    const result = await this.執行翻譯(text, sourceLang, targetLangs);

    // 3. 寫入快取
    await 寫入翻譯快取(sourceLang, text, result);

    return result;
  }

  /** 實際執行翻譯（AI → Google fallback） */
  private async 執行翻譯(
    text: string,
    sourceLang: string,
    targetLangs: string[],
  ): Promise<Record<string, string>> {
    const pool = new AIPoolManager(this.c);

    try {
      const langList = targetLangs.join(', ');
      const { 回應 } = await pool.聊天(
        PROMPT,
        [{ 角色: 'user', 內容: `將以下 ${sourceLang} 文字翻譯成 ${langList}:\n"${text}"` }],
        TRANSLATE_TASK_CONFIG,
        { maxTokens: 1024, temperature: 0.3 },
      );

      const jsonMatch = 回應.內容.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
          await info('Translator', `AI 翻譯成功: ${sourceLang} → ${targetLangs.join(',')} "${text.slice(0, 30)}"`);
          return parsed;
        } catch (parseErr) {
          await error('Translator', `JSON 解析失敗: ${parseErr}, 原始: ${回應.內容.slice(0, 200)}`);
        }
      }

      await error('Translator', `AI 未回傳有效 JSON: ${回應.內容.slice(0, 100)}`);
      return { [sourceLang]: text };
    } catch (err) {
      await error('Translator', `AI 翻譯失敗，改用 Google Translate: ${err}`);
      try {
        const result: Record<string, string> = {};
        const gt = getTranslation();
        for (const lang of targetLangs) {
          result[lang] = await gt.translate(sourceLang, lang, text);
        }
        await info('Translator', `Google 翻譯成功: ${sourceLang} → ${targetLangs.join(',')} "${text.slice(0, 30)}"`);
        return result;
      } catch (gtErr) {
        await error('Translator', `Google Translate 也失敗: ${gtErr}`);
        return { [sourceLang]: text };
      }
    }
  }

  async 批次翻譯(texts: string[], sourceLang: string, targetLangs: string[]): Promise<Record<string, string>[]> {
    if (texts.length === 0) return [];

    // 逐筆檢查快取，拆成已快取與未快取兩群
    const results: (Record<string, string> | null)[] = new Array(texts.length).fill(null);
    const uncachedTexts: string[] = [];
    const uncachedMap: number[] = []; // uncached 在原 texts 的 index

    for (let i = 0; i < texts.length; i++) {
      const cached = await 查詢翻譯快取(sourceLang, texts[i], targetLangs);
      if (cached) {
        results[i] = cached;
      } else {
        uncachedTexts.push(texts[i]);
        uncachedMap.push(i);
      }
    }

    // 全部命中快取
    if (uncachedTexts.length === 0) {
      return results as Record<string, string>[];
    }

    // 對未快取的，逐筆呼叫 AI / Google 翻譯
    for (let j = 0; j < uncachedTexts.length; j++) {
      const translated = await this.執行翻譯(uncachedTexts[j], sourceLang, targetLangs);
      const idx = uncachedMap[j];
      results[idx] = translated;
      // 寫入快取
      await 寫入翻譯快取(sourceLang, uncachedTexts[j], translated);
    }

    return results as Record<string, string>[];
  }

  static 建立翻譯Service(c: Context) {
    const translator = new Translator(c);
    return async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
      const result = await translator.翻譯(text, sourceLang, [targetLang]);
      return result[targetLang] || text;
    };
  }
}
