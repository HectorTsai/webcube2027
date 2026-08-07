/**
 * tenant 解析共用工具（auth-gateway）
 *
 * 依序從 body.tenant → cookie 訪客 JWT → Host header 取得租戶，
 * 供註冊（POST）與註冊頁面（GET）等端點共用。
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { getKeys } from './keys.ts';

/** 正規化 tenant：去協定、路徑與埠號，轉小寫 hostname */
export function normalizeTenant(tenant: string): string {
  return tenant.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '').toLowerCase();
}

/** 依序從 body.tenant → cookie 訪客 JWT → Host header 取得租戶 */
export async function resolveTenant(c: Context, bodyTenant: unknown): Promise<string | null> {
  if (typeof bodyTenant === 'string' && bodyTenant.trim()) {
    return normalizeTenant(bodyTenant.trim());
  }

  const token = getCookie(c, 'jwt');
  if (token) {
    try {
      const { publicKey } = getKeys();
      const payload = await verify(token, publicKey, 'EdDSA') as Record<string, unknown>;
      if (typeof payload.tenant === 'string' && payload.tenant) {
        return normalizeTenant(payload.tenant);
      }
    } catch {
      // 忽略無效的 cookie token，繼續往下找
    }
  }

  const host = c.req.header('host');
  if (host) return normalizeTenant(host);
  return null;
}
