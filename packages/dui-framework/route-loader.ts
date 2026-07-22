/**
 * route-loader — 檔案系統路由載入器
 *
 * 掃描 routes/ 目錄，自動載入：
 *   - Method handler（get.ts, post.ts, put.ts, del.ts, patch.ts → 對應 HTTP method）
 *   - index.tsx（目錄預設頁面 → GET）
 *   - 一般檔名（list-collection.ts → GET /path/list-collection）
 *   - 靜態檔案（.css, .svg, .png 等 → 自動服務）
 *   - _middleware.ts（目錄層級 middleware，支援 async 及 Context 傳遞）
 *   - _name_ 目錄（動態路徑參數 → :name）
 */

import { Hono, type Context, type Next } from 'hono';

// ── Types ──

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const METHOD_MAP: Record<string, HttpMethod> = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  del: 'DELETE',
  patch: 'PATCH',
};

/** MIME types for auto-served static files */
const MIME_MAP: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const STATIC_EXTS = new Set(Object.keys(MIME_MAP));

export type MiddlewareFn = (c: Context, next: Next) => Promise<Response | void | undefined> | Response | void;

interface MethodRoute {
  method: HttpMethod;
  pathPattern: string;
  fileUrl: string;
  middleware: MiddlewareFn[];
}

interface StaticRoute {
  pathPattern: string;
  filePath: string;
  mime: string;
}

interface CollectResult {
  methodRoutes: MethodRoute[];
  staticRoutes: StaticRoute[];
}

// ── File parsing ──

interface FileRouteInfo {
  method: HttpMethod;
  pathSegment: string;
}

function parseRouteFileInfo(fileName: string): FileRouteInfo | null {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  // _middleware.ts 不是路由
  if (nameWithoutExt === '_middleware') return null;

  // index → GET，pathSegment 為空（目錄本身就是路徑）
  if (nameWithoutExt === 'index') {
    return { method: 'GET', pathSegment: '' };
  }

  // 檔名本身就是 HTTP Method（get.ts, post.ts 等）
  const upper = nameWithoutExt.toUpperCase() as HttpMethod;
  if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(upper)) {
    return { method: upper, pathSegment: '' };
  }

  // 其他檔名（list-collection.ts 等）不自動註冊，由 main.ts 手動處理
  return null;
}

function toRouteSegment(name: string): string {
  const m = name.match(/^_(.+)_$/);
  return m ? `:${m[1]}` : name;
}

// ── Directory scanner ──

async function collectRoutes(
  dirUrl: string,
  basePath: string,
  middlewareStack: MiddlewareFn[],
  result: CollectResult,
): Promise<MiddlewareFn[]> {
  const normalizedUrl = dirUrl.endsWith('/') ? dirUrl : dirUrl + '/';
  let localMw: MiddlewareFn | null = null;

  const entries = [...Deno.readDirSync(new URL(normalizedUrl))];

  // 1. 載入 _middleware.ts（優先處理，讓後續掃描時 middleware 已就緒）
  for (const entry of entries) {
    if (entry.name === '_middleware.ts') {
      try {
        const mod = await import(normalizedUrl + entry.name);
        const fn = mod.middleware ?? mod.default;
        if (typeof fn === 'function') {
          localMw = fn;
        } else {
          console.warn(
            `[route-loader] ${normalizedUrl}_middleware.ts exports no valid middleware function`,
          );
        }
      } catch (err) {
        console.warn(
          `[route-loader] Failed to load middleware at ${normalizedUrl}_middleware.ts: ${err instanceof Error ? err.message : err}`,
        );
      }
      break;
    }
  }

  const newStack = localMw ? [...middlewareStack, localMw] : middlewareStack;

  for (const entry of entries) {
    // 跳過 middleware（已處理）
    if (entry.name === '_middleware.ts' || entry.name === '_middleware.tsx') continue;

    if (entry.isDirectory) {
      await collectRoutes(
        normalizedUrl + entry.name + '/',
        basePath + '/' + toRouteSegment(entry.name),
        newStack,
        result,
      );
      continue;
    }

    const ext = entry.name.substring(entry.name.lastIndexOf('.'));

    // 2. 靜態檔案
    if (STATIC_EXTS.has(ext)) {
      result.staticRoutes.push({
        pathPattern: basePath + '/' + entry.name,
        filePath: normalizedUrl + entry.name,
        mime: MIME_MAP[ext],
      });
      continue;
    }

    // 3. Method handler / index
    const info = parseRouteFileInfo(entry.name);
    if (!info) continue;

    // 限 .ts / .tsx
    if (ext !== '.ts' && ext !== '.tsx') continue;

    const pathPattern = basePath + (info.pathSegment ? '/' + info.pathSegment : '');
    result.methodRoutes.push({
      method: info.method,
      pathPattern: pathPattern || '/',  // 根路徑 => /
      fileUrl: normalizedUrl + entry.name,
      middleware: newStack,
    });
  }

  return newStack;
}

// ── Public API ──

/**
 * 掃描 routes 目錄並回傳 Hono router（含所有發現的路由、靜態檔案與 middleware）
 *
 * @param dirUrl - routes 目錄的 file:// URL
 * @returns Hono 實例
 */
export async function loadRoutes(dirUrl: URL): Promise<Hono> {
  const app = new Hono();
  const result: CollectResult = { methodRoutes: [], staticRoutes: [] };

  await collectRoutes(dirUrl.href, '', [], result);

  // 註冊靜態檔案路由
  for (const sr of result.staticRoutes) {
    app.get(sr.pathPattern as any, async (c) => {
      try {
        const content = await Deno.readFile(new URL(sr.filePath));
        return c.body(content, 200, { 'content-type': sr.mime });
      } catch {
        return c.notFound();
      }
    });
  }

  // 註冊 method 路由
  for (const route of result.methodRoutes) {
    let mod;
    try {
      mod = await import(route.fileUrl);
    } catch (err) {
      console.warn(
        `[route-loader] Failed to import ${route.fileUrl}: ${err instanceof Error ? err.message : err}`,
      );
      continue;
    }

    const handler = mod[route.method] ?? mod.default;
    if (!handler) {
      console.warn(
        `[route-loader] ${route.fileUrl} does not export '${route.method}' or default`,
      );
      continue;
    }

    const handlers: any[] = [...route.middleware, handler];
    app.on(route.method, route.pathPattern as any, ...handlers);
  }

  return app;
}
