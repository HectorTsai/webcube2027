/**
 * /api/site/* — 網站操作 API Middleware
 *
 * 所有 site 操作（apply、test-connection）皆需已認證 JWT。
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken } from '@dui/util/jwt';

export const middleware = async (c: Context, next: Next) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ success: false, error: '請先登入' }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'Token 無效或已過期' }, 401);
  }

  if (payload.type !== 'authenticated') {
    return c.json({ success: false, error: '請先登入後再操作' }, 401);
  }

  c.set('jwt_payload', payload);
  await next();
};