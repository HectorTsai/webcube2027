import { dataPool } from '@dui/database';

/** Build composite ID for data pool queries */
export function composeId(model: string, rawId: string): string {
  return `${model}:${model}:${rawId}`;
}

/** Parse composite ID back to { model, id } */
export function parseId(compositeId: string): { model: string; id: string } {
  const parts = compositeId.split(':');
  return { model: parts[0], id: parts[2] ?? parts[1] };
}

// ── JWT 驗證共用邏輯 ──────────────────────────────────

/**
 * 從 request 中提取 JWT token（依序：query param → cookie → Authorization header）
 */
export function extrairToken(c: any): string {
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
 * 從共用 L1 讀取 JWT 加密金鑰
 */
export async function getJwtSecret(): Promise<string> {
  try {
    return (await dataPool.config?.get('jwt_secret')) ?? '';
  } catch {
    return '';
  }
}

/**
 * 驗證 JWT token，成功回傳 payload，失敗回傳 null
 */
export async function verificarToken(token: string): Promise<any | null> {
  try {
    const { verify } = await import('hono/jwt');
    const secret = await getJwtSecret();
    if (!secret) return null;
    return await verify(token, secret, 'HS256');
  } catch {
    return null;
  }
}

/**
 * 當 token 來自 query param 時，將其寫入 cookie 後重新導向（移除網址上的 token）
 */
export function 寫入Cookie並重導(c: any, token: string, url: URL): Response | null {
  if (url.searchParams.has('token')) {
    c.header('Set-Cookie', `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    url.searchParams.delete('token');
    return c.redirect(url.pathname + url.search);
  }
  return null;
}
