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
 *   - .md 檔案（自動轉為 HTML 頁面→ GET，使用 _layout.tsx 的 renderPage() 或預設模板）
 *
 * 路由優先順序：.tsx > .md > index.tsx > index.md
 */

import { renderToString } from 'hono/jsx/dom/server';
import { Hono, type Context, type Next } from 'hono';
import { jsx } from 'hono/jsx';

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

// ── Helper ──

/** 從 Markdown 內容萃取第一個 # 標題 */
function extractTitle(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/** HTML 跳脫（防止 XSS） */
function ehtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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

interface MdRoute {
  pathPattern: string;
  filePath: string;
  middleware: MiddlewareFn[];
}

interface CollectResult {
  methodRoutes: MethodRoute[];
  staticRoutes: StaticRoute[];
  mdRoutes: MdRoute[];
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

    // 3. .md 檔案 → 自動註冊 GET 路由
    if (ext === '.md') {
      // 忽略 _layout.md、_middleware.md
      const nameWithoutExt = entry.name.substring(0, entry.name.length - 3);
      if (nameWithoutExt === '_layout' || nameWithoutExt === '_middleware') continue;

      let pathSegment: string;
      if (nameWithoutExt === 'index') {
        pathSegment = '';
      } else if (nameWithoutExt.startsWith('_') && nameWithoutExt.endsWith('_')) {
        pathSegment = ':' + nameWithoutExt.slice(1, -1);
      } else {
        pathSegment = nameWithoutExt;
      }

      const pathPattern = basePath + (pathSegment ? '/' + pathSegment : '');
      result.mdRoutes.push({
        pathPattern: pathPattern || '/',
        filePath: normalizedUrl + entry.name,
        middleware: newStack,
      });
      continue;
    }

    // 4. Method handler / index
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
  const result: CollectResult = { methodRoutes: [], staticRoutes: [], mdRoutes: [] };

  await collectRoutes(dirUrl.href, '', [], result);

  // 註冊靜態檔案路由
  for (const sr of result.staticRoutes) {
    app.get(sr.pathPattern as any, async (c: Context) => {
      try {
        const content = await Deno.readFile(new URL(sr.filePath));
        return c.body(content, 200, { 'content-type': sr.mime });
      } catch {
        return c.notFound();
      }
    });
  }

  // 載入 _layout.tsx（若存在），供 .tsx 元件包裹使用
  let layoutMod: any = null;
  try {
    const layoutUrl = new URL('_layout.tsx', dirUrl);
    await Deno.stat(layoutUrl);
    layoutMod = await import(layoutUrl.href);
  } catch {
    console.warn('[route-loader] _layout.tsx not found or failed to load — pages will render without shared layout');
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

    let handler: any;

    const isTsxPage = route.fileUrl.endsWith('.tsx');

    if (isTsxPage && mod.default && layoutMod?.Layout) {
      // .tsx 頁面元件（如 index.tsx、admin/index.tsx）→ 自動包裹 Layout
      const pageTitle = mod.title || route.pathPattern || 'Data Gateway';
      const PageComponent = mod.default;
      handler = async (c: Context) => {
        const content = await PageComponent(c);
        const html = '<!DOCTYPE html>' + renderToString(
          jsx(layoutMod.Layout, { title: pageTitle, children: content }),
        );
        return c.html(html);
      };
    } else if (mod[route.method]) {
      // .ts API handler（如 get.ts、post.ts）→ 直接使用，不包 Layout
      handler = mod[route.method];
    } else if (mod.default) {
      handler = mod.default;
    } else {
      console.warn(
        `[route-loader] ${route.fileUrl} has no usable export`,
      );
      continue;
    }

    if (!handler) {
      console.warn(
        `[route-loader] ${route.fileUrl} does not export '${route.method}' or default`,
      );
      continue;
    }

    const handlers: any[] = [...route.middleware, handler];
    app.on(route.method, route.pathPattern as any, ...handlers);
  }

  // 註冊 .md 路由（在 method 路由之後，確保 .tsx 優先）
  for (const md of result.mdRoutes) {
    const handlers: any[] = [
      ...md.middleware,
      async (c: Context) => {
        try {
          const content = await Deno.readTextFile(new URL(md.filePath));
          const { marked } = await import('marked');
          const htmlContent = await marked.parse(content);

          // 為 heading 加上 ID（支援 TOC anchor 連結）
          const withHeadingIds = htmlContent.replace(
            /<h([1-6])([^>]*)>(.*?)<\/h\1>/gs,
            (match: string, level: string, attrs: string, inner: string) => {
              if (/id\s*=/.test(attrs)) return match; // 已有 ID 則跳過
              const raw = inner.replace(/<[^>]*>/g, '');
              const id = raw.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
              return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
            },
          );

          // 使用 routes/_layout.tsx 的 renderPage()（已在函數頂層載入）
          if (layoutMod && typeof layoutMod.renderPage === 'function') {
            const title = extractTitle(content) || md.pathPattern;
            return c.html(layoutMod.renderPage(title, withHeadingIds));
          }

          // 預設模板（無 _layout.tsx 時使用）
          const title = extractTitle(content) || md.pathPattern;
          return c.html(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ehtml(title)}</title>
</head>
<body class="min-h-screen bg-base-200 p-6 max-w-3xl mx-auto prose">${withHeadingIds}</body>
</html>`);
        } catch {
          return c.notFound();
        }
      },
    ];
    app.on('GET', md.pathPattern as any, ...handlers);
  }

  return app;
}
