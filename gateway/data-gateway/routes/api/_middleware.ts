/**
 * 通用 API Middleware
 *
 * GET 開放任何有效 JWT（含匿名/訪客）。
 * POST / PUT / PATCH / DELETE 需已認證 JWT（拒絕匿名/訪客）。
 *
 * 當 JWT 帶有 tenant（路由至 L3）時，會檢查 `權限.l3` 是否存在。
 * 特殊端點（health/me/logout/setup/site）不受 L3 權限檢查。
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken } from '@dui/util/jwt';

/** 不需 L3 權限檢查的端點前綴 */
const NO_L3_CHECK = [
  '/api/setup', '/api/health', '/api/me', '/api/logout',
  '/api/site', '/api/anonymous-token',
];

export const middleware = async (c: Context, next: Next) => {
  const token = extractToken(c);
  let payload: any = null;

  if (token) {
    try {
      payload = await verifyToken(token);
    } catch {
      // token 無效 → 視為未攜帶 JWT
    }
  }

  if (payload) {
    c.set('jwt_payload', payload);
    if (payload.tenant) {
      c.set('effective_host', payload.tenant);
    }
  }

  const method = c.req.method;

  // 寫入操作需已認證 JWT（拒絕訪客/未登入）
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!payload || payload.type !== 'authenticated') {
      return c.json({ success: false, error: '請先登入後再操作' }, 401);
    }
  }

  // ── L3 權限檢查：有 tenant（路由至 L3）且非特殊端點 ──
  // 匿名 JWT 若無 `權限.l3` 也拒絕（服務需使用已認證帳號）
  const path = c.req.path;
  const needsL3Check = payload?.tenant
    && !NO_L3_CHECK.some((prefix) => path.startsWith(prefix));

  if (needsL3Check && !payload?.權限?.l3) {
    return c.json({ success: false, error: '無 L3 操作權限' }, 403);
  }

  await next();
};
