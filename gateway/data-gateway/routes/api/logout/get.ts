/**
 * GET /api/logout
 * 清除 JWT HttpOnly cookie，然後重新導向回首頁
 */
import type { Context } from 'hono';

/** 驗證 redirect 參數僅允許同源或相對路徑，防止 Open Redirect 攻擊 */
function getSafeRedirectUrl(reqUrl: string, rawRedirect: string | null): string {
  if (!rawRedirect) return '/';

  // 相對路徑：必須以 / 開頭且不能以 // 開頭（防止 //evil.com 繞過）
  if (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) {
    return rawRedirect;
  }

  // 絕對 URL：只允許與當前請求同源
  try {
    const current = new URL(reqUrl);
    const target = new URL(rawRedirect, reqUrl);
    if (target.origin === current.origin) {
      return target.pathname + target.search + target.hash;
    }
  } catch {
    // URL 解析失敗，退回首頁
  }

  return '/';
}

export const GET = async (c: Context) => {
  const isSecure = c.req.url.startsWith('https://');

  // 清除 JWT Cookie（Secure 屬性與登入時發放的保持一致）
  c.header(
    'Set-Cookie',
    `jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`,
  );

  const rawRedirect = c.req.query('redirect') ?? null;
  const safeRedirect = getSafeRedirectUrl(c.req.url, rawRedirect);

  return c.redirect(safeRedirect);
};
