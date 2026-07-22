/**
 * POST /api/verify
 * Token 驗證（要求 body 傳入 token）
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';

export async function POST(c: Context) {
  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ valid: false }, 401);

    const { publicKey } = getKeys();
    const payload = await verify(token, publicKey, 'EdDSA');
    return c.json({ valid: true, payload });
  } catch {
    return c.json({ valid: false }, 401);
  }
}
