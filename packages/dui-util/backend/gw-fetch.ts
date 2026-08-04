/**
 * gwFetch — 跨 Gateway HTTP 請求（自動攜帶語言、租戶與身份 context）
 *
 * 所有後端內網呼叫其他 gateway 都應透過此函式，確保目標 gateway
 * 能正確識別當前請求的語言（Accept-Language）、租戶（X-Tenant）與身份（Cookie JWT）。
 *
 * @example
 * ```ts
 * import { gwFetch } from '@dui/util';
 *
 * // 在 API handler 中
 * const dataGwUrl = await getDataGatewayUrl();
 * const res = await gwFetch(c, dataGwUrl, '/api/l2/使用者/使用者');
 * const json = await res.json();
 * ```
 */

import type { Context } from 'hono';

/**
 * 跨 Gateway HTTP 請求
 *
 * @param c 當前請求的 Hono Context（用於提取語言 c.get('lang')、租戶 c.get('tenant')、身份 Cookie）
 * @param baseUrl 目標 gateway 的 base URL（如 http://localhost:8002）
 * @param path API 路徑（如 /api/l2/使用者/使用者, /api/setup）
 * @param options 額外的 fetch 選項（method、body、headers 等）
 * @returns Response（與原生 fetch 相同，呼叫方自行解析）
 */
export async function gwFetch(
  c: Context,
  baseUrl: string,
  path: string,
  options?: RequestInit,
): Promise<Response> {
  // ── 1. 組合 URL ──
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

  // ── 2. 合併 headers ──
  const headers = new Headers(options?.headers);

  // 自動攜帶語言（根 middleware 應已注入 c.set('lang', ...)）
  const lang = c.get('lang') as string | undefined;
  if (lang && !headers.has('Accept-Language')) {
    headers.set('Accept-Language', lang);
  }

  // 自動攜帶租戶（JWT middleware 應已注入 c.set('tenant', ...)）
  const tenant = c.get('tenant') as string | undefined;
  if (tenant && !headers.has('X-Tenant')) {
    headers.set('X-Tenant', tenant);
  }

  // 自動攜帶原始 Cookie（維持 JWT 身份）
  const cookie = c.req.header('Cookie');
  if (cookie && !headers.has('Cookie')) {
    headers.set('Cookie', cookie);
  }

  // 自動補充 Content-Type（若未指定且有 body 時預設 JSON）
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // ── 3. 發起請求 ──
  return fetch(url, {
    ...options,
    headers,
  });
}