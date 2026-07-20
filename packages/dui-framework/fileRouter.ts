/**
 * fileRouter — 檔案系統路由，支援多種資源類型
 *
 * 掃描 routes/ 目錄，根據檔案名稱與目錄結構自動註冊路由。
 *
 * ## 支援的檔案類型
 *
 * | 類型 | 副檔名 | 行為 |
 * |------|--------|------|
 * | Method handler | `get.ts`, `post.ts`, `put.ts`, `del.ts`, `patch.ts` | 匯出對應 method 的 handler 函數 |
 * | 靜態檔案 | `.css`, `.svg`, `.jpg`, `.png`, `.webp`, `.js` | 自動以 GET 服務，含正確 Content-Type |
 * | 中間件 | `_middleware.ts` | 匯出 `middleware`（或 `default`）函數，套用至該目錄所有路由 |
 *
 * ## 目錄命名規則
 *
 * - `foo/` → 靜態路徑段落 `/foo`
 * - `_name_/` → 動態參數 `/:name`
 *
 * @example
 * ```
 * routes/
 * ├── admin/
 * │   ├── get.ts        → GET /admin
 * │   └── _middleware.ts → 守衛
 * ├── user.ts           → GET/POST /user + /user/:id（fallback）
 * ├── logo.svg          → GET /logo.svg
 * └── styles/
 *     └── main.css      → GET /styles/main.css
 * ```
 */

import { Hono, type MiddlewareHandler } from 'hono';

// ── Types ──

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const METHOD_MAP: Record<string, HttpMethod> = {
  get: 'GET', post: 'POST', put: 'PUT', del: 'DELETE', patch: 'PATCH',
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

/** Static file extensions we auto-serve */
const STATIC_EXTS = new Set(Object.keys(MIME_MAP));

type MiddlewareFn = MiddlewareHandler;

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
  indexRoutes: { pathPattern: string; mod: Record<string, unknown>; middleware: MiddlewareFn[] }[];
}

// ── Helpers ──

/** Extract method name from filename (e.g. `get.ts` or `get.tsx` → `GET`) */
function detectMethod(filename: string): HttpMethod | null {
  const stem = filename.replace(/\.(ts|tsx)$/, '');
  return METHOD_MAP[stem] ?? null;
}

/** Convert `_name_` → `:name` */
function toRouteSegment(name: string): string {
  const m = name.match(/^_(.+)_$/);
  return m ? `:${m[1]}` : name;
}

/** Build URL-safe path from a directory-relative file path (no extension) */
function toRoutePath(basePath: string, name: string): string {
  const stem = name.replace(/\.[^.]+$/, '');
  return basePath + '/' + stem;
}

/**
 * Recursively scan directory and collect routes.
 *
 * For method `.ts` files, the route is registered as `<basePath>/<stem>`.
 * For static files, the file is served at `<basePath>/<filename>`.
 * Both scenarios support the router's fallback mechanism.
 */
async function collectRoutes(
  dirUrl: string,
  basePath: string,
  middlewareStack: MiddlewareFn[],
  result: CollectResult,
): Promise<MiddlewareFn[]> {
  const normalizedUrl = dirUrl.endsWith('/') ? dirUrl : dirUrl + '/';
  let localMw: MiddlewareFn | null = null;

  const entries = [...Deno.readDirSync(new URL(normalizedUrl))];

  // ── 1. Load _middleware.ts ──
  for (const entry of entries) {
    if (entry.name === '_middleware.ts' || entry.name === '_middleware.tsx') {
      try {
        const mod = await import(normalizedUrl + entry.name);
        const fn = mod.middleware ?? mod.default;
        if (typeof fn === 'function') localMw = fn;
        else console.warn(
          `[fileRouter] ${normalizedUrl}${entry.name} exports no middleware function`,
        );
      } catch (err) {
        console.warn(
          `[fileRouter] Failed to load middleware at ${normalizedUrl}${entry.name}: ${err instanceof Error ? err.message : err}`,
        );
      }
      break;
    }
  }

  const newStack = localMw ? [...middlewareStack, localMw] : middlewareStack;

  // Skip utility files not meant to be routes
  const skipFiles = new Set(['_middleware.ts', '_middleware.tsx']);
  let indexMod: Record<string, unknown> | null = null;

  for (const entry of entries) {
    if (skipFiles.has(entry.name)) continue;

    if (entry.isDirectory) {
      await collectRoutes(
        normalizedUrl + entry.name + '/',
        basePath + '/' + toRouteSegment(entry.name),
        newStack,
        result,
      );
      continue;
    }

    // ── detect index.ts / index.tsx (directory root handler) ──
    if (entry.name.replace(/\.(ts|tsx)$/, '') === 'index') {
      try {
        indexMod = await import(normalizedUrl + entry.name);
      } catch (err) {
        console.warn(
          `[fileRouter] Failed to import ${normalizedUrl + entry.name}: ${err instanceof Error ? err.message : err}`,
        );
      }
      continue;
    }

    const ext = entry.name.substring(entry.name.lastIndexOf('.'));

    // ── 2. Static files ──
    if (STATIC_EXTS.has(ext)) {
      result.staticRoutes.push({
        pathPattern: basePath + '/' + entry.name,
        filePath: normalizedUrl + entry.name,
        mime: MIME_MAP[ext],
      });
      continue;
    }

    // ── 3. Method-based .ts / .tsx handlers ──
    const method = detectMethod(entry.name);
    if (method) {
      const routePath = toRoutePath(basePath, entry.name);
      result.methodRoutes.push({
        method,
        pathPattern: routePath,
        fileUrl: normalizedUrl + entry.name,
        middleware: newStack,
      });
      continue;
    }

    // Other files are silently ignored
  }

  // ── 4. Register index.ts / index.tsx (directory root handler) ──
  if (indexMod) {
    result.indexRoutes.push({ pathPattern: basePath || '/', mod: indexMod, middleware: newStack });
  }

  return newStack;
}

// ── Public API ──

/**
 * Options for {@linkcode createFileRouter}.
 */
export interface FileRouterOptions {
  /**
   * Absolute path to the routes directory (not a file:// URL).
   * If relative, resolved from the current working directory.
   * @default "./routes"
   */
  dirPath?: string;
}

/**
 * Scan a routes directory and return a Hono router with all discovered routes.
 *
 * The router supports:
 * - Method-based `.ts`/`.tsx` handlers (get.ts → GET, etc.)
 * - Static files (CSS, SVG, images) automatically served
 * - `_middleware.ts` for directory-level middleware
 * - `_name_` directories for dynamic route params
 *
 * @param options - Configuration options
 * @returns A Hono instance with all routes registered
 *
 * @example
 * ```ts
 * import { createFileRouter } from '@dui/framework/file-router';
 * const app = await createFileRouter({ dirPath: './routes' });
 * Deno.serve({ port: 8002 }, app.fetch);
 * ```
 */
export async function createFileRouter(options: FileRouterOptions = {}): Promise<Hono> {
  const dirPath = options.dirPath ?? './routes';
  const app = new Hono();

  const result: CollectResult = { methodRoutes: [], staticRoutes: [], indexRoutes: [] };

  // Resolve absolute path
  const absPath = dirPath.startsWith('/') ? dirPath : `${Deno.cwd()}/${dirPath}`;
  const dirUrl = new URL(`file://${absPath}/`).href;

  await collectRoutes(dirUrl, '', [], result);

  // ── Register static file routes ──
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

  // ── Register method-based routes ──
  for (const route of result.methodRoutes) {
    let mod;
    try {
      mod = await import(route.fileUrl);
    } catch (err) {
      console.warn(
        `[fileRouter] Failed to import ${route.fileUrl}: ${err instanceof Error ? err.message : err}`,
      );
      continue;
    }

    const handler = mod[route.method];
    if (!handler) {
      console.warn(
        `[fileRouter] ${route.fileUrl} does not export '${route.method}'`,
      );
      continue;
    }

    const handlers: any[] = [...route.middleware, handler];
    app.on(route.method, route.pathPattern as any, ...handlers);
  }

  // ── Register index.ts / index.tsx (directory root) routes ──
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
  for (const ir of result.indexRoutes) {
    for (const method of httpMethods) {
      const handler = ir.mod[method];
      if (typeof handler === 'function') {
        const handlers: any[] = [...ir.middleware, handler];
        app.on(method, ir.pathPattern as any, ...handlers);
      }
    }
  }

  return app;
}

// Re-export detectMethod for external use
export { detectMethod, toRouteSegment };
