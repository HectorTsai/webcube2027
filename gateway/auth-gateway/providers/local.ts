/**
 * Local Auth Provider — 帳號/密碼登入
 *
 * 呼叫 data-gateway 的 InnerAPI 驗證使用者。
 *
 * data-gateway URL 從 L1 動態讀取（而非 env var），
 * 確保在 setup 完成後即可使用，不需重啟。
 *
 * 注意：不提供硬編碼預設 URL，PORT 由安裝者決定。
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import type { AuthProvider, AuthResult } from './provider.ts';
import { getKeys } from '../utils/keys.ts';
import { getDataGatewayUrl } from '../utils/l1.ts';

/** JWT cookie 名稱 */
const JWT_COOKIE = 'jwt';

/**
 * 從請求中提取現有 JWT 並驗證，回傳 tenant。
 */
async function extractTenantFromJWT(c: Context): Promise<string | null> {
  const cookieHeader = c.req.header('Cookie') || '';
  const jwtMatch = cookieHeader.match(new RegExp(`${JWT_COOKIE}=([^;]+)`));
  const token = jwtMatch?.[1];
  if (!token) return null;

  try {
    const { publicKey } = getKeys();
    const payload = await verify(token, publicKey, 'EdDSA') as Record<string, unknown>;
    return (payload.tenant as string) || null;
  } catch {
    return null;
  }
}

export const localProvider: AuthProvider = {
  type: 'local',

  async login(c: Context): Promise<AuthResult> {
    try {
      const { 帳號, 密碼 } = await c.req.json();
      if (!帳號 || !密碼) {
        return { success: false, error: '請輸入帳號與密碼' };
      }

      // 從現有 JWT 提取 tenant
      const tenant = await extractTenantFromJWT(c);

      const dataGatewayUrl = await getDataGatewayUrl();

      const r = await fetch(`${dataGatewayUrl}/inner-api/auth/verify-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 帳號, 密碼, tenant }),
      });
      const res = await r.json();

      if (!res.success) {
        return { success: false, error: res.error || '帳號或密碼錯誤' };
      }

      return {
        success: true,
        payload: {
          sub: res.data.id,
          帳號: res.data.帳號,
          角色: res.data.角色,
          provider: 'local',
        },
      };
    } catch (err) {
      return { success: false, error: `登入失敗: ${err instanceof Error ? err.message : String(err)}` };
    }
  },
};
