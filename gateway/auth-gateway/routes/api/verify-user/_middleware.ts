/**
 * POST /api/verify-user — 需已安裝
 *
 * 使用者驗證依賴 data-gateway（查詢 L2/L3 使用者與角色權限），
 * 未安裝時直接拒絕，避免對未設定的 data-gateway 發出請求。
 */

import type { Context, Next } from 'hono';

export async function middleware(c: Context, next: Next) {
  if (c.get('已安裝') !== true) {
    return c.json({ success: false, error: 'auth-gateway 尚未安裝，請先完成安裝' }, 403);
  }
  return await next();
}
