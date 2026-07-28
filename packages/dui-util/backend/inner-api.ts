// deno-lint-ignore-file no-explicit-any
import type { Context } from 'hono';
import { error } from '../common/logger.ts';

// ── 模組層級 app 實例（main.ts 啟動時注入，用於同進程呼叫）──
let _app: any = null;

interface CacheEntry {
  data: unknown;
  /** Original response headers preserved for cache-hit responses */
  headers: Record<string, string>;
}

/** main.ts 啟動時呼叫，InnerAPI 內部路由依賴 */
export function 設定App(app: any): void {
  _app = app;
}

/**
 * 取得當前請求域名（hostname，不含埠號）
 */
export function 取得域名(c: Context): string {
  const host = c.req.header('host') || 'localhost';
  return host.split(':')[0] || host;
}

/**
 * 安全地正規化 URL 路徑，保留原有 query string 並避免重複編碼
 */
function normalizeUrlPath(urlPath: string): string {
  const dummy = new URL(urlPath, 'http://localhost');
  return dummy.pathname + dummy.search;
}

/**
 * 👑 透明快取版 InnerAPI
 *
 * 使用 `_app.request()` 做同進程內部路由呼叫。
 * 需先由 main.ts 呼叫 `設定App(app)` 注入 Hono app 實例。
 *
 * 底層自動完成 Request 級別去重快取，快取命中時保留原始 Response headers。
 */
export async function InnerAPI(c: Context, apiPath: string): Promise<Response> {
  try {
    const normalizedPath = normalizeUrlPath(apiPath);

    let cache = c.get('api_internal_cache') as Map<string, CacheEntry> | undefined;
    if (!cache) {
      cache = new Map<string, CacheEntry>();
      c.set('api_internal_cache', cache);
    }

    const cached = cache.get(normalizedPath);
    if (cached) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT-REQUEST-CONTEXT',
          'content-type': 'application/json',
        },
      });
    }

    const 原始Cookie = c.req.header('cookie') || '';

    if (_app && typeof _app.request === 'function') {
      const response = await _app.request(normalizedPath, {
        headers: {
          'host': 取得域名(c),
          'origin': c.req.header('origin') || 'http://localhost:8000',
          'cookie': 原始Cookie,
        },
      });

      if (response.ok) {
        const cloned = response.clone();
        try {
          const data = await cloned.json();
          cache.set(normalizedPath, {
            data,
            headers: Object.fromEntries(response.headers.entries()),
          });
        } catch {
          // 忽視非 JSON 的響應，不進入快取
        }
      }

      return response;
    } else {
      throw new Error('App 實例不可用，無法執行 InnerAPI（請確認 main.ts 已呼叫 設定App()）');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await error('InnerAPI', `內部請求失敗: ${apiPath} - ${errorMessage}`);
    throw err;
  }
}