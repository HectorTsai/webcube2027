/**
 * Logout 共用邏輯 — GET /api/logout 與 POST /api/logout
 *
 * 登出為「帳號服務」的一環，統一由 auth-gateway 處理：
 * 1. 清除 auth-gateway 自身網域的 jwt HttpOnly cookie
 * 2. 依 redirect 參數導回原頁（僅允許相對路徑或與 data-gateway 同源的絕對 URL，防 Open Redirect）
 * 3. 跨域同步：redirect 目標為 data-gateway 時，自動附加 `logout=1` 標記，
 *    由 data-gateway 根 middleware 清除其自身 cookie（對稱登入的 `?token=` 握手）
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { getConfig } from '../../../utils/config.ts';
import { getKeys } from '../../../utils/keys.ts';
import { accountPool } from '../../../services/account-pool.ts';

/** 登出失敗時的預設導向 */
const DEFAULT_REDIRECT = '/';

/**
 * 驗證 redirect 目標並決定是否附加登出標記。
 * 回傳 { target, markLogout }：
 *   - target：安全的導向目標（相對路徑）
 *   - markLogout：target 指向 data-gateway 時為 true，需附加 `logout=1`
 */
async function resolveRedirect(c: Context): Promise<{ target: string; markLogout: boolean }> {
  const raw = c.req.query('redirect') ?? null;

  if (!raw) return { target: DEFAULT_REDIRECT, markLogout: false };

  // 相對路徑：必須以 / 開頭且不能以 // 開頭（防止 //evil.com 繞過）
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return { target: raw, markLogout: false };
  }

  // 絕對 URL：僅允許與 data-gateway（設定中的 data_gateway_url）同源
  try {
    const target = new URL(raw);
    let dataGwUrl: string | null = null;
    try {
      dataGwUrl = await getConfig().get('data_gateway_url') ?? null;
    } catch {
      // 尚未安裝 → 無 data-gateway，絕對 URL 一律不允許
    }

    if (dataGwUrl) {
      const dataOrigin = new URL(dataGwUrl).origin;
      if (target.origin === dataOrigin) {
        return { target: target.pathname + target.search, markLogout: true };
      }
    }
  } catch {
    // URL 解析失敗 → 一律退回預設導向
  }

  return { target: DEFAULT_REDIRECT, markLogout: false };
}

/** 清除 auth-gateway 自身網域的 jwt cookie（不指定 HttpOnly，以同時清除 HttpOnly 與非 HttpOnly 版本） */
function clearJwtCookie(c: Context): void {
  const isSecure = c.req.url.startsWith('https://');
  c.header(
    'Set-Cookie',
    `jwt=; Path=/; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`,
  );
}

export async function logoutHandler(c: Context) {
  // 先從 cookie 讀取 JWT 資訊（清除前），再清除 cookie
  const jwtToken = (c.req.header('Cookie') || '').match(/jwt=([^;]+)/)?.[1];

  if (jwtToken) {
    try {
      const { publicKey } = getKeys();
      const payload = await verify(decodeURIComponent(jwtToken), publicKey, 'EdDSA') as Record<string, unknown>;
      const 帳號 = payload.帳號 as string;
      const tenant = payload.tenant as string | undefined;
      if (帳號) accountPool.recordLogout(帳號, tenant);
    } catch { /* JWT 解析失敗則不記錄登出 */ }
  }

  clearJwtCookie(c);

  const { target, markLogout } = await resolveRedirect(c);

  // 導向 data-gateway 時附加登出標記（若尚未帶上），供其清除自身網域的 cookie
  if (markLogout) {
    const url = new URL(target, c.req.url);
    if (!url.searchParams.has('logout')) {
      url.searchParams.set('logout', '1');
    }
    return c.redirect(url.pathname + url.search);
  }

  return c.redirect(target);
}
