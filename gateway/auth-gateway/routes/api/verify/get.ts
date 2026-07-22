/**
 * GET /api/verify
 * Token 驗證（從 Authorization Header 或 Cookie 讀取 token）
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';

export async function GET(c: Context) {
  const authHeader = c.req.header('Authorization');
  const cookieToken = c.req.header('Cookie')?.match(/jwt=([^;]+)/)?.[1];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) return c.json({ valid: false }, 401);

  try {
    const { publicKey } = getKeys();
    const payload = await verify(token, publicKey, 'EdDSA');
    return c.json({ valid: true, payload });
  } catch {
    return c.json({ valid: false }, 401);
  }
}
