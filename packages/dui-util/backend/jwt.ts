/**
 * JWT 驗證共用工具
 *
 * 供各 gateway 驗證 auth-gateway 簽發的 Ed25519 JWT token。
 * 從環境變數 AUTH_GATEWAY_URL 讀取 auth-gateway 位置以取得公鑰，
 * 支援金鑰輪換（驗證失敗時自動重新取得公鑰）。
 *
 * 亦可透過第二個參數直接傳入 authGatewayUrl。
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';

// ── Public Key Cache (Single-flight Pattern) ──

let publicKeyPromise: Promise<CryptoKey> | null = null;
let _cachedAuthUrl: string | null = null;

/**
 * 設定或重新設定 auth-gateway URL 快取。
 * 可在初始化階段由 gateway 主動呼叫（避免依賴環境變數）。
 */
export function setAuthGatewayUrl(url: string): void {
  _cachedAuthUrl = url;
  publicKeyPromise = null; // 清除快取，下次重新取得公鑰
}

/** 取得 auth-gateway URL：優先使用快取值，其次環境變數 */
function getAuthGatewayUrl(): string {
  if (_cachedAuthUrl) return _cachedAuthUrl;
  const env = Deno.env.get('AUTH_GATEWAY_URL');
  if (env) return env;
  throw new Error('auth-gateway URL 尚未設定。請設定 AUTH_GATEWAY_URL 環境變數或呼叫 setAuthGatewayUrl()。');
}

/** 從 auth-gateway 取得 Ed25519 公鑰 */
async function fetchPublicKey(): Promise<CryptoKey> {
  const authUrl = getAuthGatewayUrl();

  const res = await fetch(`${authUrl}/api/jwt-public-key`);
  if (!res.ok) throw new Error(`取得 JWT 公鑰失敗：${res.status}`);

  const { publicKey: publicKeyHex } = await res.json();

  // Hex → Uint8Array（奇數長度自動補零）
  const cleanHex = publicKeyHex.length % 2 !== 0 ? `0${publicKeyHex}` : publicKeyHex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }

  return await crypto.subtle.importKey(
    'spki', bytes, { name: 'Ed25519' }, false, ['verify'],
  );
}

/** 單飛取得公鑰：併發請求共享同一個 in-flight Promise */
async function getPublicKey(): Promise<CryptoKey> {
  if (!publicKeyPromise) {
    publicKeyPromise = fetchPublicKey().catch((err) => {
      publicKeyPromise = null; // 失敗時清空，下次重試
      throw err;
    });
  }
  return await publicKeyPromise;
}

// ── Public API ──

/**
 * 從 request 中提取 JWT token（依序：query param → cookie → Authorization header）
 */
export function extractToken(c: Context): string {
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
export async function verifyToken<T = Record<string, unknown>>(
  token: string,
): Promise<T | null> {
  try {
    const key = await getPublicKey();
    return await verify(token, key, 'EdDSA') as T;
  } catch {
    // Public key might have been rotated — retry once
    publicKeyPromise = null;
    try {
      const key = await getPublicKey();
      return await verify(token, key, 'EdDSA') as T;
    } catch {
      return null;
    }
  }
}

/**
 * 當 token 來自 query param 時，將其寫入 cookie 後重新導向（移除網址上的 token）
 */
export function 寫入Cookie並重導(c: Context, token: string, url: URL): Response | null {
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