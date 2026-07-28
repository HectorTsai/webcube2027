/**
 * /api/l2/* — L2 系統資料操作 API
 *
 * 需已認證 JWT 且具備 L2 權限，effective_host = undefined（操作 L2 系統資料庫）。
 * 細部 collection 層級的權限檢查由 crud.ts 處理。
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

  // 檢查是否有任何 L2 權限
  const perms = (payload as any).權限;
  if (!perms?.l2) {
    return c.json({ success: false, error: '無 L2 操作權限' }, 403);
  }

  // 操作 L2（系統資料庫）
  c.set('jwt_payload', payload);
  c.set('effective_host', undefined);

  await next();
};