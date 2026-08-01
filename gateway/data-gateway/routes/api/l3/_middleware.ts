/**
 * /api/l3/* — L3 資料操作 API Middleware
 *
 * L3 操作皆需已認證 JWT 且具備 L3 權限。
 * GET 可允許訪客唯讀（細部權限由 crud.ts 控制）。
 * POST/PUT/PATCH/DELETE 需 type === 'authenticated'。
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken } from '@dui/util/jwt';

export const middleware = async (c: Context, next: Next) => {
  const token = extractToken(c);
  let payload: any = null;

  if (token) {
    try {
      payload = await verifyToken(token);
    } catch {
      // token 無效
    }
  }

  if (!payload) {
    return c.json({ success: false, error: '請先登入' }, 401);
  }

  // 從 payload 取得 tenant 作為 L3 路由識別
  if (payload.tenant) {
    c.set('effective_host', payload.tenant);
  }

  const method = c.req.method;
  const isWriteOp = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // 寫入操作需已認證（拒絕訪客/未登入）
  if (isWriteOp && payload.type !== 'authenticated') {
    return c.json({ success: false, error: '請先登入後再操作' }, 401);
  }

  // 檢查 L3 權限
  if (!payload?.權限?.l3) {
    return c.json({ success: false, error: '無 L3 操作權限' }, 403);
  }

  c.set('jwt_payload', payload);
  await next();
};