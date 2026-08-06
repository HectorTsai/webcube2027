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

import { Hono, Context, type Next } from 'hono';
import { jsx } from 'hono/jsx';
import { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_SET } from '@dui/smartmultilingual';

// ── Types ──

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** 所有支援的 HTTP method */
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] satisfies HttpMethod[]);

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
  // 忽略開頭的 YAML Front Matter（若有），避免 front matter 內的 # 行被誤判為標題
  const cleanMd = md.replace(/^---[\s\S]*?---\s*/, '');
  const match = cleanMd.match(/^#\s+(.+)$/m);
  if (!match) return null;
  // 剝除 HTML 標籤，確保 <title> 分頁列顯示純字串（而非 &lt;i&gt; 等轉義字面）
  return match[1].replace(/<[^>]*>/g, '').trim();
}

/** HTML 跳脫（防止 Markdown 標題注入 HTML；& < > " 一次到位） */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 多國語言支援 ──

/** 從 Accept-Language header 解析出語言偏好列表（按 q 值排序） */
function parseAcceptLanguage(header: string): string[] {
  if (!header) return [];
  return header
    .split(',')
    .map((tag) => {
      const [lang, qPart] = tag.split(';');
      const q = qPart ? parseFloat(qPart.replace('q=', '').trim()) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q)
    .map((item) => item.lang);
}

/** 從 Accept-Language 比對出最適合的支援語言，找不到回退 zh-tw */
function detectBestLanguage(acceptHeader: string): string {
  const parsed = parseAcceptLanguage(acceptHeader);

  // 1. 完全比對
  for (const lang of parsed) {
    if (SUPPORTED_LANGUAGE_SET.has(lang as never)) return lang;
  }

  // 2. 主要語系比對（如 zh → zh-tw、zh-cn）
  for (const lang of parsed) {
    const primary = lang.split('-')[0];
    if (primary === lang) continue;
    for (const supported of SUPPORTED_LANGUAGES) {
      if (supported.startsWith(primary + '-') || supported === primary) {
        return supported;
      }
    }
  }

  return 'zh-tw';
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
  // 注意 del.ts → 'DEL' 需對應到 HTTP 的 DELETE
  const upper = nameWithoutExt.toUpperCase();
  if (upper === 'DEL') {
    return { method: 'DELETE', pathSegment: '' };
  }
  if (HTTP_METHODS.has(upper as HttpMethod)) {
    return { method: upper as HttpMethod, pathSegment: '' };
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

// ── Compose helper ──

/** 執行 Handler/Middleware 鏈條（維持完整洋蔥機制） */
async function runHandlerChain(handlers: any[], c: Context): Promise<Response | void> {
  const dispatch = async (index: number): Promise<Response | void> => {
    if (index >= handlers.length) return;
    const handler = handlers[index];
    const res = await handler(c, () => dispatch(index + 1));
    // 仿照 Hono compose：middleware 可能以 `await next()`（不回傳）串接，
    // 此時將 handler 產生的 Response 存入 Context（setter 會同步設定 finalized），
    // 讓外層即使吞掉回傳值，最終仍能從 c.finalized / c.res 取得回應。
    if (res instanceof Response && !c.finalized) {
      c.res = res;
    }
    return res;
  };
  return await dispatch(0);
}

// ── Public API ──

/**
 * 掃描 routes 目錄並回傳 Hono router（含所有發現的路由、靜態檔案與 middleware）
 *
 * @param dirUrl - routes 目錄的 file:// URL
 * @param existingApp - 可選：直接註冊到這個 Hono 實例（而非新建）。
 *        供 createGateway 先把全域 middleware / 選用性資源（如 Alpine runtime）
 *        掛好再註冊檔案路由——Hono 依註冊順序匹配，先註冊的靜態路徑
 *        （如 /alpine.min.js）才不會被後續的參數路由（如 /:lang）搶走，
 *        同時保留本函式註冊的 notFound 退回機制。
 * @returns Hono 實例（existingApp 或新建）
 */
export async function loadRoutes(dirUrl: URL, existingApp?: Hono): Promise<Hono> {
  const app = existingApp ?? new Hono();
  const result: CollectResult = { methodRoutes: [], staticRoutes: [], mdRoutes: [] };

  await collectRoutes(dirUrl.href, '', [], result);

  // ── 檢查是否有 _lang_ 目錄（多國語言路由） ──
  let hasLangDir = false;
  try {
    for (const entry of Deno.readDirSync(dirUrl)) {
      if (entry.name === '_lang_' && entry.isDirectory) {
        hasLangDir = true;
        break;
      }
    }
  } catch { /* ignore */ }

  // 註冊靜態檔案路由（初始化時預先快取內容，避免每次請求重複讀檔）
  // 預載失敗時仍要註冊路由，改為 runtime 降級重讀——否則該檔案會靜默失去 GET 路由
  for (const sr of result.staticRoutes) {
    // 型別宣告用標準 Uint8Array（不寫死泛型），避免綁定特定 lib 版本
    let cachedContent: Uint8Array | undefined;
    try {
      cachedContent = await Deno.readFile(new URL(sr.filePath));
    } catch {
      console.warn(
        `[route-loader] Failed to pre-load static file: ${sr.filePath} — will retry on demand`,
      );
    }
    app.get(sr.pathPattern as any, async (c: Context) => {
      let data = cachedContent;
      if (!data) {
        try {
          data = await Deno.readFile(new URL(sr.filePath));
          cachedContent = data; // 寫回快取，後續請求不再重讀
        } catch {
          return c.notFound();
        }
      }
      // 唯一必要的邊界斷言：Deno.readFile 的泛型是 Uint8Array<ArrayBufferLike>，
      // 而 hono c.body 的 Data 在此版本需要 Uint8Array<ArrayBuffer>；
      // 執行期底層 buffer 必為 ArrayBuffer，此斷言僅為滿足型別。
      // no-cache：靜態資源每次重新驗證，避免開發迭代時瀏覽器吃到舊版
      // （app.js / css 等小型管理介面資源，重新驗證成本可忽略）
      return c.body(data as Uint8Array<ArrayBuffer>, 200, {
        'content-type': sr.mime,
        'cache-control': 'no-cache',
      });
    });
  }

  // ── 若有 _lang_ 目錄，在根路徑註冊語言偵測 redirect ──
  if (hasLangDir) {
    app.get('/', async (c: Context) => {
      const acceptLang = c.req.header('Accept-Language') || '';
      const bestLang = detectBestLanguage(acceptLang);
      return c.redirect(`/${bestLang}/`, 302);
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

  // ── Pass 1：註冊 method 主路由（不含退回機制）──
  //
  // 靜態路徑優先排序：確保 /api/me、/api/health 等精確路由
  // 先於 /api/:collection、/api/:id 等參數化路由被 Hono 匹配。
  result.methodRoutes.sort((a, b) => {
    const aHasParam = a.pathPattern.includes(':');
    const bHasParam = b.pathPattern.includes(':');

    if (!aHasParam && bHasParam) return -1; // 純靜態優先
    if (aHasParam && !bHasParam) return 1;

    // 層級深的優先（更精確的匹配優先）
    const aDepth = a.pathPattern.split('/').length;
    const bDepth = b.pathPattern.split('/').length;
    if (aDepth !== bDepth) return bDepth - aDepth;

    return a.pathPattern.localeCompare(b.pathPattern);
  });

  // 供 Pass 3（退回機制）使用的路由資訊
  // patternSegs 在初始化時就預先拆好，避免 notFound 高頻觸發時重複 split/filter
  const methodRouteInfos: {
    method: HttpMethod;
    path: string;
    patternSegs: string[];
    handlers: any[];
  }[] = [];

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
        const lang = c.get('lang') || 'zh-tw';
        // Layout 可能為 async（伺服端讀取 ConfigStore），需 await 後再 renderToString
        const layoutJsx = await layoutMod.Layout({ title: pageTitle, lang, children: content });
        const html = '<!DOCTYPE html>' + renderToString(layoutJsx);
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

    // 儲存供 Pass 3（退回機制）使用
    methodRouteInfos.push({
      method: route.method,
      path: route.pathPattern,
      patternSegs: route.pathPattern.split('/').filter(Boolean),
      handlers,
    });

    // 若路由不含尾綴斜線且不為 '/'，同時註冊尾綴斜線版本
    // 讓 /:lang 與 /:lang/ 都能正確匹配
    const path = route.pathPattern;
    if (path !== '/' && !path.endsWith('/')) {
      app.on(route.method, [path, path + '/'] as any, ...handlers);
    } else {
      app.on(route.method, path as any, ...handlers);
    }
  }

  // ── Pass 2：註冊 .md 路由（在主路由之後、退回機制之前）──
  // 確保 .md 的精確路徑（如 /:lang/doc）比退回機制的 wildcard 優先被匹配
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
            const lang = c.get('lang') || 'zh-tw';
            // 統一在此跳脫 title（XSS 防護）：
            // renderPage 收到的 title 為「已跳脫」字串，各 layout 不得再跳脫，否則雙重跳脫
            const title = escapeHtml(extractTitle(content) || md.pathPattern);
            return c.html(await layoutMod.renderPage(title, withHeadingIds, lang));
          }

          // 預設模板（無 _layout.tsx 時使用）
          // 手動跳脫 title 防止 XSS（marked 已處理主體內容，但 title 是額外提取的）
          const title = escapeHtml(extractTitle(content) || md.pathPattern);
          return c.html(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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

  // ── Pass 3：階層降級退回（Hierarchical Fallback via notFound）──
  //
  // 廢除舊有的 /* wildcard 方式（會搶走精確靜態路由的匹配機會），
  // 改為在 notFound 中實作「逐層剝皮」退回演算法：
  //
  //   1. 請求未命中任何精確路由 → 進入 notFound
  //   2. 將 URL 路徑從最深層開始，逐層去掉最後一段往上找
  //   3. 若找到對應的母路由，執行其 handler 並設 rest_path
  //   4. 一路找不到（含根目錄 /，由 i=0 涵蓋）才回傳 404
  //
  // 例如：
  //   GET /api/使用者/角色/all 無精確匹配
  //   → 嘗試匹配 /api/使用者/角色 → /api/使用者 → /api → /
  //   → 命中了 /api/:collection/:model 的 handler
  //   → rest_path = "all"
  app.notFound(async (c: Context) => {
    const method = c.req.method as HttpMethod;
    const pathSegments = c.req.path.split('/').filter(Boolean);

    // 從最深層開始，逐層往上剝皮（i = 0 時 parentPath 即為 '/'，已涵蓋根目錄退回）
    for (let i = pathSegments.length - 1; i >= 0; i--) {
      const parentPath = '/' + pathSegments.slice(0, i).join('/');
      const restPath = pathSegments.slice(i).join('/');
      const parentPathWithSlash = parentPath === '/' ? '/' : parentPath + '/';

      for (const ri of methodRouteInfos) {
        if (ri.method !== method) continue;

        // 精確比對（靜態路徑）
        const isExactMatch = ri.path === parentPath || ri.path === parentPathWithSlash;

        // 動態參數比對（如 /api/:collection/:model 匹配 /api/網站/角色）：
        // 逐段比對的同時收集 :param 對應的值，供遮蔽 param() 注入
        // patternSegs 已於初始化時預先拆好（見 methodRouteInfos）
        let params: Record<string, string> = {};
        let isParamMatch = ri.patternSegs.length === i;
        if (isParamMatch) {
          for (let idx = 0; idx < i; idx++) {
            const seg = ri.patternSegs[idx];
            if (seg.startsWith(':')) {
              params[seg.slice(1)] = pathSegments[idx];
            } else if (seg !== pathSegments[idx]) {
              isParamMatch = false;
              break;
            }
          }
        }
        if (!isParamMatch) params = {};

        if (isExactMatch || isParamMatch) {
          // 直接複用原 Context（而非 new Context）：
          //   1) 避免每次比對命中都建立新物件，減少 GC 壓力
          //   2) 保留先前 middleware 存入的變數（如 jwt_payload、effective_host）
          // 參數注入改用遮蔽 c.req.param()：
          //   notFound 的 Context 沒有路由參數資料，c.req.param() 甚至會因
          //   #matchResult 為空而拋錯；而 HonoRequest 的 #matchResult 是
          //   hard-private 無法直接寫入，但 param() 是原型方法，
          //   可透過 instance own property 暫時遮蔽、用完即刪。
          c.set('rest_path', restPath);
          const req = c.req;
          (req as any).param = (key?: string) => (key ? params[key] : params);

          // 透過頂層 runHandlerChain 執行 Middleware 洋蔥鏈條
          let res: Response | void;
          try {
            res = await runHandlerChain(ri.handlers, c);
          } finally {
            delete (req as any).param; // 還原原型 param()，避免影響後續比對/請求
          }
          if (res instanceof Response) return res;
          // middleware 可能以 `await next()`（不回傳）串接，吞掉 handler 的回傳值，
          // 此時 handler 產生的 Response 存在 Context 的 res / finalized 上，需一併檢查
          if (c.finalized && c.res) return c.res;
        }
      }
    }

    return c.text('404 Not Found', 404);
  });

  return app;
}