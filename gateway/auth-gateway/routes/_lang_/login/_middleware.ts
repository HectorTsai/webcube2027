/**
 * Login 頁面中介層 — 已登入者跳回首頁
 *
 * 驗證 JWT 簽章後，若為已認證 token（type === 'authenticated'）才視為已登入並跳回首頁。
 * 簽章無效或已過期的 token 不觸發跳轉，讓使用者可以重新登入。
 */

import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';

export async function middleware(c: Context, next: Next) {
  const lang = c.get('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  const cookieHeader = c.req.header('Cookie') || '';

  // 尋找 JWT cookie
  const match = cookieHeader.match(/jwt=([^;]+)/);
  if (match) {
    const token = decodeURIComponent(match[1]);
    try {
      const { publicKey } = getKeys();
      const payload = await verify(token, publicKey, 'EdDSA') as { type?: string };

      // 已認證 token → 已登入，跳回首頁
      if (payload.type === 'authenticated') {
        return c.redirect(`${prefix}/`);
      }
    } catch {
      // token 無效（簽章不符/過期/格式錯誤）→ 視為未登入，繼續顯示登入頁
    }
  }

  return await next();
}
