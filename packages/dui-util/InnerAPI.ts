// deno-lint-ignore-file no-explicit-any
import { Context } from 'hono';
import { error } from './logger.ts';

// ── 模組層級 app 實例（main.ts 啟動時注入，用於同進程呼叫）──
let _app: any = null;

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
 * 自動編碼 URL 參數
 */
function encodeUrlParams(url: string): string {
  const [path, queryString] = url.split('?');
  if (!queryString) return url;
  return `${path}?${new URLSearchParams(queryString).toString()}`;
}

/**
 * 👑 透明快取版 InnerAPI
 *
 * 使用 `_app.request()` 做同進程內部路由呼叫。
 * 需先由 main.ts 呼叫 `設定App(app)` 注入 Hono app 實例。
 *
 * 底層自動完成 Request 級別去重快取。
 */
export async function InnerAPI(c: Context, apiPath: string): Promise<Response> {
  try {
    const encodedPath = encodeUrlParams(apiPath);

    let cache = c.get('api_internal_cache') as Map<string, unknown> | undefined;
    if (!cache) {
      cache = new Map<string, unknown>();
      c.set('api_internal_cache', cache);
    }

    if (cache.has(encodedPath)) {
      const cachedData = cache.get(encodedPath);
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT-REQUEST-CONTEXT'
        }
      });
    }

    const 原始Cookie = c.req.header('cookie') || '';

    if (_app && typeof _app.request === 'function') {
      const response = await _app.request(encodedPath, {
        headers: {
          'host': 取得域名(c),
          'origin': c.req.header('origin') || 'http://localhost:8000',
          'cookie': 原始Cookie
        }
      });

      if (response.ok) {
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          cache.set(encodedPath, data);
        } catch {
          // 忽視非 JSON 的響應
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
