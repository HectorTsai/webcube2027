/**
 * ai-gateway 根 middleware
 *
 * 使用 auth-gateway 的 Ed25519 公鑰驗證 JWT token。
 * 共用邏輯委託 @dui/util/jwt（自動從 L1 取得公鑰，支援金鑰輪換）。
 */

import type { Context, Next } from 'hono';
import { error } from '@dui/util';
import { extractToken, verifyToken as verifyJwt } from '@dui/util/jwt';

// ── 驗證 token（middleware wrapper）──
async function verifyAndSetPayload(c: Context, next: Next) {
  const token = extractToken(c);

  if (!token) {
    return c.json({ success: false, message: '未提供 Token' }, 401);
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    await error('Auth', 'JWT 驗證失敗');
    return c.json({ success: false, message: 'Token 無效或已過期' }, 401);
  }

  c.set('jwtPayload', payload);
  await next();
}

// ── 根 middlewared — 放行公開路徑，API 路徑需驗證 ──
export async function middleware(c: Context, next: Next) {
  const path = c.req.path;

  // 公開端點
  const isPublic =
    path === '/' ||
    path === '/health' ||
    path.startsWith('/css/') ||
    path.startsWith('/static/') ||
    path.startsWith('/favicon') ||
    path === '/login' ||
    /\\.(css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(path);

  if (isPublic) {
    return await next();
  }

  // /api/* 需要驗證
  if (path.startsWith('/api/')) {
    return await verifyAndSetPayload(c, next);
  }

  return await next();
}