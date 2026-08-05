/**
 * @dui/framework — Gateway 統一框架
 *
 * 提供 Gateway 啟動入口 createGateway()、檔案路由系統 loadRoutes(),
 * 以及共用前端 API Console。
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadRoutes } from './route-loader.ts';
import { traceStorage } from '@dui/util/common/logger';

// ─── Re-exports ──────────────────────────────────────────────

export type { PermissionMap } from './permission.ts';
export { mergePermissions } from './permission.ts';

// ─── Gateway 物件型別 ───────────────────────────────────────

export interface Gateway {
  app: Hono;
  dataDir: string;
  port: number;
  start: () => void;
}

export interface CreateGatewayOptions {
  /** Gateway 名稱（用於啟動日誌） */
  name?: string;
  /** HTTP 監聽埠號 */
  port?: number;
  /** import.meta.dirname!，用於定位 routes/ 與 data/ 路徑 */
  dirname: string;
}

// ─── 全域 Middleware ─────────────────────────────────────────

/**
 * Trace ID Middleware
 *
 * 為每個進來的請求注入 X-Request-ID / Trace ID：
 * 1. 若 incoming request 已有 X-Request-ID header，沿用該值
 * 2. 若無，自動以 crypto.randomUUID().slice(0, 8) 產生 8 字元短 ID
 * 3. 以 c.set('trace_id', traceId) 注入 Hono Context
 * 4. 在 response headers 中設定 X-Request-ID
 * 5. 以 AsyncLocalStorage 包裹後續處理，使 Logger 自動讀取 trace_id
 */
function traceIdMiddleware() {
  return async (c: any, next: any) => {
    const existedId = c.req.header('X-Request-ID');
    const traceId = existedId || crypto.randomUUID().slice(0, 8);
    c.set('trace_id', traceId);

    // 以 AsyncLocalStorage 包裹，使 Logger 在請求鏈路中自動取得 trace_id
    await traceStorage.run(traceId, () => next());

    // 確保 response 也有 X-Request-ID header
    c.res.headers.set('X-Request-ID', traceId as string);
  };
}

// ─── CORS Middleware ──────────────────────────────────────────

function corsMiddleware() {
  return cors({
    origin: ['http://localhost:8000', 'http://localhost:8001', 'http://localhost:8002', 'http://localhost:8003'],
    credentials: true,
  });
}

// ─── createGateway ────────────────────────────────────────────

export async function createGateway(options: CreateGatewayOptions): Promise<Gateway> {
  const { dirname, name = 'gateway', port = 8000 } = options;

  // 計算路徑
  const dataDir = `${dirname}/data`;
  const routesDir = `${dirname}/routes`;

  // 載入 Hono 應用程式（含檔案路由或空白 app）
  let app: Hono;

  try {
    await Deno.readDir(routesDir);
    app = await loadRoutes(routesDir);
  } catch {
    // routes/ 不存在，建立空白 Hono app
    app = new Hono();
  }

  // 註冊全域 Middleware（順序：CORS → Trace ID）
  // Hono 的 app.use 會在路由 handler 之前執行，順序由上而下
  app.use('*', corsMiddleware());
  app.use('*', traceIdMiddleware());

  // 回傳 Gateway 物件
  const gateway: Gateway = {
    app,
    dataDir,
    port,
    start() {
      const log = [`${name}`, `port=${port}`, `data=${dataDir}`];
      console.log(`🚀 [${name}] 啟動完成 (${log.join(', ')})`);
      Deno.serve({ port }, app.fetch);
    },
  };

  return gateway;
}