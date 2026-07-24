/**
 * Admin area JWT auth middleware.
 *
 * 驗證失敗時導向 auth-gateway 登入頁面（瀏覽器友善）。
 *
 * 注意：auth-gateway URL 不從環境變數或模組層級常數讀取，
 * 而是從 L1 config（安裝時儲存的值）於每次請求時讀取，
 * 避免安裝時填寫的 URL 與實際使用的不一致。
 */

import type { Context, Next } from 'hono';
import { dataPool } from '@dui/database';
import { extractToken, verifyToken, 寫入Cookie並重導 } from '../../utils/jwt.ts';

async function 取得AuthGatewayUrl(): Promise<string> {
  const l1 = dataPool.config;
  if (l1) {
    const stored = await l1.get('auth_gateway_url');
    if (stored) return stored;
  }
  // 不提供硬編碼 fallback，PORT 由安裝者決定
  const envUrl = Deno.env.get('AUTH_GATEWAY_URL');
  if (envUrl) return envUrl;
  throw new Error('auth-gateway URL 尚未設定。請先完成安裝流程或設定 AUTH_GATEWAY_URL 環境變數。');
}

export const middleware = async (c: Context, next: Next) => {
  const url = new URL(c.req.url);
  const token = extractToken(c);
  const authGatewayUrl = await 取得AuthGatewayUrl();

  if (!token) {
    // 從請求的 Host header 取得 tenant（domain，不含 port）
    const host = c.req.header('host') || '';
    const tenant = host.split(':')[0]; // "localhost" 或 "www.example.com"
    return c.redirect(
      `${authGatewayUrl}/login?redirect=${encodeURIComponent(url.href)}&tenant=${encodeURIComponent(tenant)}`,
    );
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.redirect(`${authGatewayUrl}/login?redirect=${encodeURIComponent(url.href)}`);
  }

  // 如果 token 來自 query param，寫入 cookie 後重新導向
  const redirectRes = 寫入Cookie並重導(c, token, url);
  if (redirectRes) return redirectRes;

  // 💡 記得加上 return，確保 Response 能正確順著洋蔥模型回傳
  return await next();
};