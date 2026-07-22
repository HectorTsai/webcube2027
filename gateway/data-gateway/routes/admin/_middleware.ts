/**
 * Admin area JWT auth middleware.
 *
 * 驗證失敗時導向 auth-gateway 登入頁面（瀏覽器友善）。
 */

import type { Context, Next } from 'hono';
import { extrairToken, verificarToken, 寫入Cookie並重導 } from '../../utils/jwt.ts';

const AUTH_GATEWAY_URL = Deno.env.get('AUTH_GATEWAY_URL') || 'http://localhost:8003';

export const middleware = async (c: Context, next: Next) => {
  const url = new URL(c.req.url);
  const token = extrairToken(c);

  if (!token) {
    return c.redirect(`${AUTH_GATEWAY_URL}/login?redirect=${encodeURIComponent(url.href)}`);
  }

  const payload = await verificarToken(token);
  if (!payload) {
    return c.redirect(`${AUTH_GATEWAY_URL}/login?redirect=${encodeURIComponent(url.href)}`);
  }

  // 如果 token 來自 query param，寫入 cookie 後重新導向
  const redirectRes = 寫入Cookie並重導(c, token, url);
  if (redirectRes) return redirectRes;

  // 💡 記得加上 return，確保 Response 能正確順著洋蔥模型回傳
  return await next();
};