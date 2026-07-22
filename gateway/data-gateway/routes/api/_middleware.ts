/**
 * API area JWT auth middleware.
 *
 * API client 友善：驗證失敗時回傳 401 JSON，不重新導向。
 *
 * /api/setup 為公開安裝端點，不需 JWT 驗證。
 */

import type { Context, Next } from 'hono';
import { extrairToken, verificarToken } from '../../utils/jwt.ts';

export const middleware = async (c: Context, next: Next) => {
  // /api/setup 是公開安裝端點，跳過 JWT 驗證
  if (c.req.path === '/api/setup') {
    return await next();
  }

  const token = extrairToken(c);

  if (!token) {
    return c.json({ success: false, error: '未提供認證 token' }, 401);
  }

  const payload = await verificarToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'token 無效或已過期' }, 401);
  }

  // 將 payload 存入 context，供後續 API handler 使用
  c.set('jwt_payload', payload);

  // 記得要 return，讓非同步洋蔥模型完美閉環
  return await next();
};