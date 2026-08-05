/**
 * gwFetch — 跨 Gateway HTTP 客戶端
 *
 * 封裝 Deno 原生 fetch，自動攜帶目前請求的 Context 資訊，
 * 使目標 Gateway 能正確識別來源請求的語言、租戶、身份與追蹤碼。
 *
 * 自動攜帶的 Headers：
 *   - Accept-Language: c.get('lang')
 *   - X-Tenant: c.get('tenant')
 *   - Cookie: c.req.header('Cookie')（維持 JWT 登入狀態）
 *   - X-Request-ID: c.get('trace_id')（分散式追蹤）
 *   - Content-Type: 若 options 有 body 且未指定時，預設 application/json
 */

import type { Context } from 'hono';

export async function gwFetch(
  c: Context,
  baseUrl: string,
  path: string,
  options?: RequestInit,
): Promise<Response> {
  // 合併 headers
  const headers = new Headers(options?.headers);

  // 語言
  const lang = c.get('lang') as string | undefined;
  if (lang && !headers.has('Accept-Language')) {
    headers.set('Accept-Language', lang);
  }

  // 租戶
  const tenant = c.get('tenant') as string | undefined;
  if (tenant && !headers.has('X-Tenant')) {
    headers.set('X-Tenant', tenant);
  }

  // 身份（維持原始 Cookie）
  const cookie = c.req.header('Cookie');
  if (cookie && !headers.has('Cookie')) {
    headers.set('Cookie', cookie);
  }

  // Trace ID（分散式追蹤）
  const traceId = c.get('trace_id') as string | undefined;
  if (traceId && !headers.has('X-Request-ID')) {
    headers.set('X-Request-ID', traceId);
  }

  // Content-Type 預設
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

  return await fetch(url, {
    ...options,
    headers,
  });
}