// 翻譯 Task — AI 接手多國語言翻譯，Google Translate 作為 fallback

import { Context } from 'hono';
import { getTranslation } from '@dui/smartmultilingual';
import { AIPoolManager } from '../pool.ts';
import { AITaskConfig, AI能力標籤 } from '../provider/adapter.ts';
import { error } from '../../../utils/logger.ts';

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
    const pool = new AIPoolManager(this.c);

    try {
      const langList = targetLangs.join(', ');
      const { 回應 } = await pool.聊天(
        PROMPT,
        [{ 角色: 'user', 內容: `將以下 ${sourceLang} 文字翻譯成 ${langList}:\n"${text}"` }],
        TRANSLATE_TASK_CONFIG,
        { maxTokens: 1024, temperature: 0.3 }
      );

      // 嘗試提取第一個 JSON 物件（非貪婪匹配）
      const jsonMatch = 回應.內容.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Record<string, string>;
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
        return result;
      } catch (gtErr) {
        await error('Translator', `Google Translate 也失敗: ${gtErr}`);
        return { [sourceLang]: text };
      }
    }
  }

  async 批次翻譯(texts: string[], sourceLang: string, targetLangs: string[]): Promise<Record<string, string>[]> {
    if (texts.length === 0) return [];

    const pool = new AIPoolManager(this.c);
    const langList = targetLangs.join(', ');
    const textList = texts.map((t, i) => `${i + 1}. "${t}"`).join('\n');

    try {
      const { 回應 } = await pool.聊天(
        PROMPT,
        [{ 角色: 'user', 內容: `將以下 ${sourceLang} 文字分別翻譯成 ${langList}，回傳 JSON 陣列:\n${textList}` }],
        TRANSLATE_TASK_CONFIG,
        { maxTokens: 2048, temperature: 0.3 }
      );

      const jsonMatch = 回應.內容.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Record<string, string>[];
        } catch (parseErr) {
          await error('Translator', `批次 JSON 解析失敗: ${parseErr}, 原始: ${回應.內容.slice(0, 200)}`);
        }
      }

      await error('Translator', '批次翻譯 JSON 解析失敗');
      return texts.map(t => ({ [sourceLang]: t }));
    } catch (err) {
      await error('Translator', `批次 AI 翻譯失敗，改用 Google Translate: ${err}`);
      try {
        const gt = getTranslation();
        const results: Record<string, string>[] = [];
        for (const text of texts) {
          const entry: Record<string, string> = {};
          for (const lang of targetLangs) {
            entry[lang] = await gt.translate(sourceLang, lang, text);
          }
          results.push(entry);
        }
        return results;
      } catch (gtErr) {
        await error('Translator', `批次 Google Translate 也失敗: ${gtErr}`);
        return texts.map(t => ({ [sourceLang]: t }));
      }
    }
  }

  static 建立翻譯Service(c: Context) {
    const translator = new Translator(c);
    return async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
      const result = await translator.翻譯(text, sourceLang, [targetLang]);
      return result[targetLang] || text;
    };
  }
}
