/**
 * POST /api/login
 * 使用者登入 — 驗證帳號密碼，簽發已認證 JWT
 *
 * 從現有 JWT cookie 提取 tenant（若無則回傳錯誤），
 * 驗證成功後簽發含 tenant + 使用者身份的已認證 JWT。
 */

import type { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { localProvider } from '../../../providers/local.ts';
import { getKeys } from '../../../utils/keys.ts';

/** JWT cookie 名稱 */
const JWT_COOKIE = 'jwt';

/**
 * 從請求中提取現有 JWT 並驗證，回傳 tenant。
 * 若無 JWT 或驗證失敗則回傳 null。
 */
async function extractTenantFromJWT(c: Context): Promise<string | null> {
  // 1. 從 cookie 讀取
  const cookieHeader = c.req.header('Cookie') || '';
  const jwtMatch = cookieHeader.match(new RegExp(`${JWT_COOKIE}=([^;]+)`));
  const token = jwtMatch?.[1];
  if (!token) return null;

  // 2. 驗證 JWT 並取出 tenant
  try {
    const { publicKey } = getKeys();
    const payload = await verify(token, publicKey, 'EdDSA') as Record<string, unknown>;
    return (payload.tenant as string) || null;
  } catch {
    return null;
  }
}

export async function POST(c: Context) {
  // 1. 取得 tenant
  const tenant = await extractTenantFromJWT(c);
  if (!tenant) {
    return c.json(
      { success: false, error: '無法識別租戶，請先取得匿名 JWT 後再登入' },
      401,
    );
  }

  // 2. 驗證帳號密碼（委託 data-gateway inner API）
  const result = await localProvider.login(c);
  if (!result.success || !result.payload) {
    return c.json({ success: false, error: result.error ?? '登入失敗' }, 401);
  }

  // 3. 簽發已認證 JWT（含 tenant + 使用者身份）
  const { privateKey } = getKeys();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    tenant,
    帳號: result.payload.帳號,
    角色: result.payload.角色,
    type: 'authenticated',
    iat: now,
    exp: now + 86400, // 24 小時
  };

  const token = await sign(payload, privateKey, 'EdDSA');

  // 4. 設定 HttpOnly cookie
  c.header(
    'Set-Cookie',
    `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );

  return c.json({
    success: true,
    data: {
      token,
      帳號: result.payload.帳號,
      角色: result.payload.角色,
      tenant,
    },
  });
}