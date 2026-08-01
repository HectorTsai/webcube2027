/**
 * Admin page JWT auth middleware.
 *
 * 僅允許 超級管理員 存取，拒絕所有其他角色與訪客。
 * 不符合條件的請求導向回首頁，不會有 403 頁面。
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken, 寫入Cookie並重導 } from '@dui/util/jwt';

const 超級管理員角色 = '使用者:角色:超級管理員';

function 是超級管理員(payload: any): boolean {
  const 角色 = payload.角色 || payload.roles;
  if (!角色) return false;
  if (Array.isArray(角色)) return 角色.includes(超級管理員角色);
  return 角色 === 超級管理員角色;
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

  // 角色檢查：僅限超級管理員，否則跳轉回首頁
  if (!是超級管理員(payload)) {
    return c.redirect(`/${lang}/`);
  }

  return await next();
};