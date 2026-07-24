/**
 * API area JWT auth middleware.
 *
 * 接受任何有效 JWT（匿名或已認證），將 payload 存入 context。
 * 個別 handler 可依 `jwt_type` 決定回傳資料範圍：
 *   - "anonymous"     — 僅回傳公開資料
 *   - "authenticated" — 回傳完整資料（含登入者專屬內容）
 *
 * /api/setup 為公開安裝端點，不需 JWT 驗證。
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken } from '../../utils/jwt.ts';

export const middleware = async (c: Context, next: Next) => {
  // /api/setup 是公開安裝端點，跳過 JWT 驗證
  if (c.req.path === '/api/setup') {
    return await next();
  }

  const token = extractToken(c);

  if (!token) {
    return c.json({ success: false, error: '未提供認證 token' }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'token 無效或已過期' }, 401);
  }

  // 將 payload 存入 context，供後續 API handler 使用
  c.set('jwt_payload', payload);
  c.set('tenant', payload.tenant);
  c.set('jwt_type', payload.type); // "anonymous" | "authenticated"

  return await next();
};