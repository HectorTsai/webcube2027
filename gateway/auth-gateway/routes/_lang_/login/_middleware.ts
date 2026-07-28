/**
 * Login 頁面中介層 — 已登入者跳回首頁
 *
 * 若已有 JWT cookie（非匿名），表示已登入，直接 redirect 到首頁。
 */

import type { Context, Next } from 'hono';

export async function middleware(c: Context, next: Next) {
  const lang = c.get('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  const cookieHeader = c.req.header('Cookie') || '';

  // 尋找 JWT cookie
  const match = cookieHeader.match(/jwt=([^;]+)/);
  if (match) {
    const token = decodeURIComponent(match[1]);
    try {
      // 解碼 JWT payload（不驗證簽章，只檢查 type）
      // 使用 TextDecoder 處理 UTF-8（JWT payload 可能含中文）
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const decoded = new TextDecoder().decode(bytes);
      const payload = JSON.parse(decoded);

      // 已認證 token → 已登入，跳回首頁
      if (payload.type === 'authenticated') {
        return c.redirect(`${prefix}/`);
      }
    } catch {
      // token 解析失敗，視為未登入，繼續顯示登入頁
    }
  }

  return await next();
}
