/**
 * POST /api/login
 * 使用者登入 — 驗證帳號密碼，簽發已認證 JWT
 *
 * tenant 取得順序：body 的 `tenant` 欄位（自訂登入畫面直接帶入）→
 * cookie 訪客 JWT 提取（訪客先行流程）→ Host header 推斷（直接造訪 auth-gateway）。
 * tenant 為可選：L2 使用者（超級管理員）屬系統層、不隸屬租戶，登入不需 tenant；
 * 僅 L3 站台管理員需要 tenant。
 * 驗證成功後簽發含使用者身份的已認證 JWT（L3 登入時含 tenant）。
 */

import type { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { localProvider } from '../../../providers/local.ts';
import { getKeys } from '../../../utils/keys.ts';

/** JWT cookie 名稱 */
const JWT_COOKIE = 'jwt';

/**
 * 從請求中提取現有 JWT 並驗證，回傳 tenant（cookie 訪客 JWT 備援）。
 * 若無 JWT 或驗證失敗則回傳 null。
 */
async function extractTenantFromJWT(c: Context): Promise<string | null> {
  // 從 cookie 讀取（訪客 JWT）
  const cookieHeader = c.req.header('Cookie') || '';
  const jwtMatch = cookieHeader.match(new RegExp(`${JWT_COOKIE}=([^;]+)`));
  const token = jwtMatch?.[1];
  if (!token) return null;

  // 驗證 JWT 並取出 tenant
  try {
    const { publicKey } = getKeys();
    const payload = await verify(token, publicKey, 'EdDSA') as Record<string, unknown>;
    return (payload.tenant as string) || null;
  } catch {
    return null;
  }
}

export async function POST(c: Context) {
  // 1. 取得 tenant（依序）：body 的 `tenant` 欄位（自訂登入畫面直接帶入）→
  //    cookie 訪客 JWT 提取（訪客先行流程）
  let body: Record<string, unknown> = {};
  try {
    body = await c.req.json();
  } catch {
    // body 非 JSON → 保留空物件，由下方檢查回報
  }

  let tenant = typeof body.tenant === 'string' && body.tenant.trim() ? body.tenant.trim() : null;
  if (!tenant) {
    tenant = await extractTenantFromJWT(c);
  }
  if (!tenant) {
    // 無 body tenant 且無訪客 JWT cookie（例如直接訪問 auth-gateway 註冊/登入頁）時，
    // 從 Host header 推斷租戶（Domain = Tenant ID，不含埠號）。
    // 不會誤導 L2 使用者：下方 finalTenant 僅在實際登入層級為 L3 時才寫入 JWT，
    // 且 verifyPassword 在 L3 查無使用者時會 fallback 至 L2。
    tenant = (c.req.header('Host') || '').replace(/:\d+$/, '').toLowerCase() || null;
  }
  // tenant 可為 null：L2 使用者（超級管理員）屬系統層、不隸屬租戶，登入不需 tenant；
  // 僅 L3 站台管理員需要 tenant（L2 查不到時依 tenant 查 L3）

  // 2. 驗證帳號密碼（透過本地 /api/verify-user，bcrypt + 權限合併）
  const result = await localProvider.login(c, tenant ?? undefined);
  if (!result.success || !result.payload) {
    return c.json({ success: false, error: result.error ?? '登入失敗' }, 401);
  }

  // 3. 簽發已認證 JWT（含使用者身份 + 角色權限；tenant 僅在 L3 使用者登入時帶入）
  const { privateKey } = getKeys();
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    sub: result.payload.sub,
    帳號: result.payload.帳號,
    名稱: result.payload.名稱,
    角色: result.payload.角色,
    type: 'authenticated',
    iat: now,
    exp: now + 86400, // 24 小時
  };
  // tenant 僅在實際登入層級為 L3 時帶入；L2 fallback 登入（如 testuser 在 L2）
  // 即使訪客 JWT / body 帶了 tenant，也不得寫入，否則後續操作會被導向 L3。
  const layer = (result.payload as any).layer as 'L2' | 'L3' | undefined;
  const finalTenant = tenant && layer === 'L3' ? tenant : null;
  if (finalTenant) payload.tenant = finalTenant;

  // 若 verify-user 有回傳權限則帶入 JWT payload
  if ((result.payload as any).權限) {
    payload.權限 = (result.payload as any).權限;
  }

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
      tenant: finalTenant,
    },
  });
}