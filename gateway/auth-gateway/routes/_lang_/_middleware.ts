/**
 * _lang_ 目錄中介軟體
 *
 * 從 URL 路徑參數 `:lang` 取得語言碼，驗證是否為支援的語言，
 * 存入 `c.set('lang', lang)` 供下游 handler 與 Layout 使用。
 *
 * 不支援的語言碼視為無效，fallback 到 `en`。
 */

import type { Context, Next } from 'hono';
import { SUPPORTED_LANGUAGE_SET } from '@dui/smartmultilingual';

export const middleware = async (c: Context, next: Next) => {
  const langParam = c.req.param('lang') || '';
  const lang = langParam.toLowerCase();

  if (SUPPORTED_LANGUAGE_SET.has(lang as never)) {
    c.set('lang', lang);
  } else {
    // 不支援的語言碼 fallback 到英文
    c.set('lang', 'en');
  }

  return await next();
};
