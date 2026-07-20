// Services 主要進入點

import { Context } from 'hono';
import { error } from '../utils/logger.ts';

// ── 模組層級 app 實例（main.ts 啟動時注入）──
let _app: any = null;

/** main.ts 啟動時呼叫，InnerAPI 內部路由依賴 */
export function 設定App(app: any): void {
  _app = app;
}

/**
 * 取得當前請求語言（透過 InnerAPI 快取）
 * 所有 API handler 統一使用此函數，替代過去的 c.get('語言')
 */
export async function 取得語言(c: Context): Promise<string> {
  const res = await InnerAPI(c, '/api/v1/language');
  const { data } = await res.json();
  return data?.語言 || 'zh-tw';
}

/**
 * 取得當前請求域名（hostname，不含埠號）
 * 替代過去的 c.get('host')，保證與舊 middleware 行為一致：
 *   localhost:8000 → localhost
 *   example.com:443 → example.com
 *   192.168.1.5:8000 → 192.168.1.5
 */
export function 取得域名(c: Context): string {
  const host = c.req.header('host') || 'localhost';
  // 剝離埠號，只取 hostname
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
 * 呼叫端完全不需要知道快取存在，只要傳入 context，底層自動完成 Request 級別去重！
 * 快取存在 Context 中，隨 request 結束消滅，確保多租戶隔離。
 */
export async function InnerAPI(c: Context, apiPath: string): Promise<Response> {
  try {
    const encodedPath = encodeUrlParams(apiPath);

    // 🎯 從 Request Context 中取得或初始化本次請求專屬的快取桶
    let cache = c.get('api_internal_cache') as Map<string, unknown> | undefined;
    if (!cache) {
      cache = new Map<string, unknown>();
      c.set('api_internal_cache', cache);
    }

    // 🎯 快取命中：直接回傳複製的 Response（避開網路消耗）
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

    // Cookie 安全透傳（原始 cookie 直接轉發，不注入語言）
    const 原始Cookie = c.req.header('cookie') || '';

    if (_app && typeof _app.request === 'function') {
      const response = await _app.request(encodedPath, {
        headers: {
          'host': 取得域名(c),
          'origin': c.req.header('origin') || 'http://localhost:8000',
          'cookie': 原始Cookie
        }
      });

      // 🎯 快取寫入：請求成功且是正確的 JSON 響應，默默將資料記進 Context 中
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

// pageService / rendererService / testService 暫不匯出（非 AI 相關）
