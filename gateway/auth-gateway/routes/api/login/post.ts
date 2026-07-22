/**
 * POST /api/login
 * 使用者登入（驗證帳號密碼，簽發 JWT）
 */

import type { Context } from 'hono';
import { sign } from 'hono/jwt';
import { localProvider } from '../../../providers/local.ts';
import { getKeys } from '../../../utils/keys.ts';

export async function POST(c: Context) {
  const result = await localProvider.login(c);

  if (!result.success || !result.payload) {
    return c.json({ success: false, error: result.error ?? '登入失敗' }, 401);
  }

  // Sign JWT with Ed25519 (24h expiry)
  const { privateKey } = getKeys();
  const payload = {
    ...result.payload,
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = await sign(payload, privateKey, 'EdDSA');

  // Set httpOnly cookie
  c.header(
    'Set-Cookie',
    `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );

  return c.json({
    success: true,
    data: { token, 帳號: result.payload.帳號, 角色: result.payload.角色 },
  });
}
