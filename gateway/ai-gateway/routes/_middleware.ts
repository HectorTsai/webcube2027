/**
 * ai-gateway 根 middleware
 *
 * 使用 auth-gateway 的 Ed25519 公鑰驗證 JWT token。
 * 邏輯與 data-gateway routes/_utils.ts 一致。
 */

import type { Context, Next } from 'hono';
import { error } from '@dui/util';

const AUTH_GW = Deno.env.get('AUTH_GATEWAY_URL') || 'http://localhost:8003';

// ── 快取公鑰 ──
let cachedPublicKey: CryptoKey | null = null;
let publicKeyHex: string | null = null;

async function fetchPublicKey(): Promise<CryptoKey> {
  const res = await fetch(`${AUTH_GW}/api/jwt-public-key`);
  if (!res.ok) throw new Error(`Failed to fetch public key: ${res.status}`);
  const json = await res.json();
  const hex = json.publicKey ?? json.data?.publicKey ?? json;
  if (typeof hex !== 'string') throw new Error('Invalid public key format');

  publicKeyHex = hex;
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey(
    'spki',
    bytes,
    { name: 'Ed25519' },
    false,
    ['verify'],
  );
  cachedPublicKey = key;
  return key;
}

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;
  return await fetchPublicKey();
}

// ── 驗證 token ──
export async function verificarToken(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return c.json({ success: false, message: '未提供 Token' }, 401);
  }

  try {
    const publicKey = await getPublicKey();
    const { verify } = await import('hono/jwt');
    const payload = await verify(token, publicKey, 'EdDSA');
    c.set('jwtPayload', payload);
    await next();
  } catch (err) {
    // 金鑰輪換：驗證失敗時清除快取重試一次
    if (cachedPublicKey) {
      cachedPublicKey = null;
      publicKeyHex = null;
      try {
        const publicKey = await fetchPublicKey();
        const { verify } = await import('hono/jwt');
        const payload = await verify(token, publicKey, 'EdDSA');
        c.set('jwtPayload', payload);
        await next();
        return;
      } catch {
        // fall through
      }
    }
    await error('Auth', `JWT 驗證失敗：${err}`);
    return c.json({ success: false, message: 'Token 無效或已過期' }, 401);
  }
}

// ── 根 middlewared — 放行公開路徑，API 路徑需驗證 ──
export async function middleware(c: Context, next: Next) {
  const path = c.req.path;

  // 公開端點
  const isPublic =
    path === '/' ||
    path === '/health' ||
    path.startsWith('/css/') ||
    path.startsWith('/static/') ||
    path.startsWith('/favicon') ||
    path === '/login' ||
    /\\.(css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(path);

  if (isPublic) {
    return await next();
  }

  // /api/* 需要驗證
  if (path.startsWith('/api/')) {
    return await verificarToken(c, next);
  }

  return await next();
}