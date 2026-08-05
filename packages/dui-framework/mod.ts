/**
 * @dui/framework — Gateway 統一框架
 *
 * 提供 Gateway 啟動入口 createGateway()、檔案路由系統 loadRoutes(),
 * 以及共用前端 API Console。
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadRoutes } from './route-loader.ts';
import { mountAlpineAssets } from './alpine.ts';
import { traceStorage } from '@dui/util/common/logger';

// ─── Re-exports ──────────────────────────────────────────────

export type { PermissionMap, LevelPermission, CollectionPermission, PermissionValue } from './permission.ts';
export {
  mergePermissions,
  checkAccess,
  checkPermission,
  extractCollection,
} from './permission.ts';
export {
  loadSeeds,
  computeSeedsHash,
  detectSeedLevels,
  syncSeeds,
  syncAllSeeds,
  seedHashKey,
} from './seed-sync.ts';
export type { SeedLevel, SeedKV, SyncSeedsOptions, SyncSeedsResult } from './seed-sync.ts';
export { generatePageCss, UNOCSS_THEME_COLORS, COMPONENT_CSS } from './unocss.ts';
export { ALPINE_JS_PATH, ALPINE_VERSION, getAlpineDist, mountAlpineAssets, alpineScripts } from './alpine.ts';

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
  /** 是否掛載 Alpine.js runtime（GET /alpine.min.js，供頁面以 AlpineScript 使用） */
  alpine?: boolean;
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
  const routesDir = new URL(`${dirname}/routes/`, 'file:///');

  // 載入 Hono 應用程式（含檔案路由或空白 app）
  // 順序很重要：Hono 依「註冊順序」匹配路由（實測：後註冊的單段靜態路徑
  // /alpine.min.js 會被先註冊的參數路由 /:lang 搶走）。因此先建 app、
  // 註冊全域 middleware 與選用性 Alpine runtime，最後才讓 loadRoutes
  // 把檔案路由註冊到同一個 app（保留其 notFound 退回機制）。
  const app = new Hono();

  // 註冊全域 Middleware（順序：CORS → Trace ID）
  // Hono 的 app.use 會在路由 handler 之前執行，順序由上而下
  app.use('*', corsMiddleware());
  app.use('*', traceIdMiddleware());

  // 選用：掛載 Alpine.js runtime（GET /alpine.min.js）
  if (options.alpine) {
    await mountAlpineAssets(app);
  }

  // 載入檔案路由（直接註冊到同一個 app）
  try {
    await Deno.readDir(routesDir);
    await loadRoutes(routesDir, app);
  } catch {
    // routes/ 不存在 → 保留 middleware / Alpine 路由即可
  }

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