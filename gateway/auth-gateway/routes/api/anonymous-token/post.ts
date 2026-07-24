/**
 * POST /api/anonymous-token — 簽發匿名 JWT
 *
 * 提供無 JWT 的服務（WebCube 或其他 Gateway）向 auth-gateway 取得匿名 JWT。
 * 匿名 JWT 僅含 tenant 資訊，不含使用者身份。
 *
 * Request body:  { domain: "www.dui.com.tw" }
 * Response:      { success: true, data: { token: "eyJ..." } }
 */

import type { Context } from 'hono';
import { sign } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';

/** 匿名 JWT 有效期（秒）— 1 小時 */
const ANONYMOUS_TTL = 3600;

export async function POST(c: Context) {
  try {
    const { domain } = await c.req.json();

    if (!domain || typeof domain !== 'string') {
      return c.json({ success: false, error: '請提供 domain' }, 400);
    }

    const { privateKey } = getKeys();
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      tenant: domain,
      type: 'anonymous',
      iat: now,
      exp: now + ANONYMOUS_TTL,
    };

    const token = await sign(payload, privateKey, 'EdDSA');

    return c.json({ success: true, data: { token } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `簽發匿名 JWT 失敗：${msg}` }, 500);
  }
}