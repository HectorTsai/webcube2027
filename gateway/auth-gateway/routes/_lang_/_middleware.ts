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
    // 以 URL 參數覆蓋根 middleware 的 Accept-Language 猜測（更準確）
    c.set('lang', lang);
    // 寫入語言 cookie，讓客戶端 API 請求（如 /api/me）也能得知當前語言
    c.header('Set-Cookie', `lang=${lang}; Path=/; SameSite=Lax`);
  }
  // 不支援的語言碼 → 保留根 middleware 的 Accept-Language 值不做任何動作

  return await next();
};
