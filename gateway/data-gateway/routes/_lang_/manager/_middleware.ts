/**
 * Manager page JWT auth middleware.
 *
 * 僅允許已認證使用者（具備 L3 權限者）存取，拒絕訪客與無權限者。
 * 不符合條件的請求導向回首頁，不會有 403 頁面。
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken, 寫入Cookie並重導 } from '@dui/util/jwt';

/** 檢查 payload 是否具備 L3 存取權限 */
function 有L3權限(payload: any): boolean {
  return !!payload?.權限?.l3?.default;
}

export const middleware = async (c: Context, next: Next) => {
  const url = new URL(c.req.url);
  const token = extractToken(c);

  const lang = c.get('lang') || 'zh-tw';

  if (!token) {
    return c.redirect(`/${lang}/`);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.redirect(`/${lang}/`);
  }

  // 寫入 cookie（即使角色不符，也能讓 /api/me 讀到登入狀態）
  const redirectRes = 寫入Cookie並重導(c, token, url);
  if (redirectRes) return redirectRes;

  // 必須是已認證使用者且具備 L3 權限
  if (payload.type !== 'authenticated' || !有L3權限(payload)) {
    return c.redirect(`/${lang}/`);
  }

  return await next();
};