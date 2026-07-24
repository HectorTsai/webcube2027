/**
 * POST /api/verify
 * Token 驗證（要求 body 傳入 token）
 * 回傳 payload 資訊（含 tenant、帳號、角色）
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';

export async function POST(c: Context) {
  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ valid: false, error: '未提供 token' }, 401);

    const { publicKey } = getKeys();
    const payload = await verify(token, publicKey, 'EdDSA');

    return c.json({
      valid: true,
      payload: {
        tenant: payload.tenant,
        帳號: payload.帳號,
        角色: payload.角色,
        type: payload.type,
      },
    });
  } catch {
    return c.json({ valid: false, error: 'token 無效或已過期' }, 401);
  }
}