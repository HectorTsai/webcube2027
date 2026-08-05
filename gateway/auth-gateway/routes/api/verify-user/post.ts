/**
 * POST /api/verify-user
 * 驗證使用者帳號密碼（bcrypt + permission merge）
 *
 * 此 HTTP handler 直接呼叫內部的 verifyUser 服務函式，
 * 不再透過 data-gateway inner API 或 HTTP loopback。
 *
 * Request:  { 帳號: string, 密碼: string, tenant?: string }
 * Response: { success: true, data: { id, 帳號, 角色, layer, 權限 } }
 */

import type { Context } from 'hono';
import { verifyUser } from '../../../services/verify-user.ts';

export async function POST(c: Context) {
  try {
    const { 帳號, 密碼, tenant } = await c.req.json();
    const result = await verifyUser(帳號, 密碼, tenant);

    if (!result.success) {
      return c.json(result, 400);
    }

    return c.json({ success: true, data: result.data });
  } catch (err) {
    return c.json(
      { success: false, error: `驗證失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}