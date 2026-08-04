/**
 * POST /api/login — 需已安裝
 *
 * 登入依賴 data-gateway（/api/verify-user 查詢使用者與角色），
 * 未安裝時直接拒絕，避免對未設定的 data-gateway 發出請求。
 */

import type { Context, Next } from 'hono';

export async function middleware(c: Context, next: Next) {
  if (c.get('已安裝') !== true) {
    return c.json({ success: false, error: 'auth-gateway 尚未安裝，請先完成安裝' }, 403);
  }
  return await next();
}
