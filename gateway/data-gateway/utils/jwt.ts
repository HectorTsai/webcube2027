/**
 * JWT 驗證共用工具
 *
 * 從 dataPool.config（L1）讀取 auth-gateway URL，取得 Ed25519 公鑰並快取。
 * 支援金鑰輪換（驗證失敗時自動重新取得公鑰）。
 */

import { dataPool } from '@dui/database';

// ── Helper ──

/** Build composite ID for data pool queries */
export function composeId(model: string, rawId: string): string {
  return `${model}:${model}:${rawId}`;
}

/** Parse composite ID back to { model, id } */
export function parseId(compositeId: string): { model: string; id: string } {
  const parts = compositeId.split(':');
  return { model: parts[0], id: parts[2] ?? parts[1] };
}

// ── JWT Verification ──

let cachedPublicKey: CryptoKey | null = null;

/** 從 auth-gateway 取得 Ed25519 公鑰 */
async function fetchPublicKey(): Promise<CryptoKey> {
  const l1 = dataPool.config;
  if (!l1) throw new Error('L1 尚未就緒，請先呼叫 dataPool.setConfigStore()');

  const authUrl = await l1.get('auth_gateway_url');
  if (!authUrl) throw new Error('auth-gateway URL 尚未設定，請先完成 /setup');

  const res = await fetch(`${authUrl}/api/jwt-public-key`);
  if (!res.ok) throw new Error(`取得 JWT 公鑰失敗：${res.status}`);

  const { publicKey: publicKeyHex } = await res.json();

  // Hex → Uint8Array
  const bytes = new Uint8Array(publicKeyHex.length / 2);
  for (let i = 0; i < publicKeyHex.length; i += 2) {
    bytes[i / 2] = parseInt(publicKeyHex.slice(i, i + 2), 16);
  }

  return await crypto.subtle.importKey(
    'spki', bytes, { name: 'Ed25519' }, false, ['verify'],
  );
}

/**
 * 從 request 中提取 JWT token（依序：query param → cookie → Authorization header）
 */
export function extractToken(c: any): string {
  const url = new URL(c.req.url);
  let token = url.searchParams.get('token') || '';
  if (!token) {
    const cookieHeader = c.req.header('Cookie') || '';
    const jwtMatch = cookieHeader.match(/jwt=([^;]+)/);
    if (jwtMatch) token = jwtMatch[1];
  }
  if (!token) {
    const authHeader = c.req.header('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
  }
  return token;
}

/**
 * 驗證 JWT token (Ed25519)，成功回傳 payload，失敗回傳 null
 *
 * 第一次呼叫時自動從 auth-gateway 取得 public key 並快取。
 * 若驗證失敗會嘗試重新取得 public key（支援金鑰輪換）。
 */
export async function verifyToken(token: string): Promise<any | null> {
  try {
    if (!cachedPublicKey) {
      cachedPublicKey = await fetchPublicKey();
    }

    const { verify } = await import('hono/jwt');
    return await verify(token, cachedPublicKey, 'EdDSA');
  } catch {
    // Public key might have been rotated — retry once
    cachedPublicKey = null;
    try {
      cachedPublicKey = await fetchPublicKey();
      const { verify } = await import('hono/jwt');
      return await verify(token, cachedPublicKey, 'EdDSA');
    } catch {
      return null;
    }
  }
}

/**
 * 當 token 來自 query param 時，將其寫入 cookie 後重新導向（移除網址上的 token）
 */
export function 寫入Cookie並重導(c: any, token: string, url: URL): Response | null {
  if (url.searchParams.has('token')) {
    c.header(
      'Set-Cookie',
      `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
    );
    url.searchParams.delete('token');
    return c.redirect(url.pathname + url.search);
  }
  return null;
}