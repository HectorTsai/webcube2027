// translate API 模組 - 單字翻譯
// /api/v1/translate/{key} → 將 {key} 翻譯成使用者語言
import { 取得語言 } from '../index.ts';
import { Context } from 'hono';
import { RouteParams } from './index.ts';
import { Translator } from '../aiService/task/translator.ts';

export async function GET(c: Context, params: RouteParams): Promise<Response> {
  const key = params.id;
  if (!key) {
    return c.json({ success: false, error: { code: 'BAD_REQUEST', message: '缺少翻譯 key' } }, 400);
  }

  const sourceLang = 'en';
  const targetLang = await 取得語言(c);

  try {
    const translator = new Translator(c);
    const result = await translator.翻譯(key, sourceLang, [targetLang]);
    const translated = result[targetLang] || key;

    return c.json({ success: true, data: translated });
  } catch {
    return c.json({ success: false, error: { code: 'TRANSLATE_FAILED', message: '翻譯失敗' } }, 500);
  }
}

import { APIModule } from './index.ts';

const API: APIModule = { GET };

export default API;
