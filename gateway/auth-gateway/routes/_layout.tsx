/**
 * auth-gateway 共用版面
 *
 * 提供 Layout 元件供 .tsx 頁面共用，以及 renderPage() 供 .md 頁面使用。
 *
 * .tsx 頁面 export default 元件後，route-loader 會自動套用 Layout。
 * .md 頁面由 route-loader 呼叫 renderPage() 轉為完整 HTML。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { jsx } from 'hono/jsx';
import { raw } from 'hono/html';

const ICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3E%3C/svg%3E";

/** HTML 跳脫 */
function ehtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 更新 navbar 上的 status-badge */
const STATUS_SCRIPT = `
async function authHealthCheck() {
  try {
    const r = await fetch('/health').then(r => r.json());
    const el = document.getElementById('status-badge');
    if (r.status === 'ok' || r.l1 === 'connected') {
      el.textContent = '\u2713 已連線';
      el.className = 'badge badge-soft badge-success';
    } else {
      el.textContent = '\u2717 異常';
      el.className = 'badge badge-soft badge-error';
    }
  } catch {
    document.getElementById('status-badge').textContent = '無法連線';
    document.getElementById('status-badge').className = 'badge badge-soft badge-error';
  }
}
authHealthCheck();
`;

/**
 * Layout 元件 — 提供完整的 HTML 外殼（navbar + 主要區塊 + footer）
 *
 * .tsx 頁面 export default 的元件會自動被 route-loader 用此 Layout 包裹。
 * 頁面元件只需要渲染主要內容，無需自行處理 <html>、<head>、<body>。
 */
export const Layout = ({ title, children, lang }: { title: string; children: any; lang?: string }) => {
  const prefix = `/${lang || 'zh-tw'}`;
  return (
  <html lang={lang || 'zh-TW'} data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{ehtml(title)} — Auth Gateway</title>
      <link rel="icon" type="image/svg+xml" href={ICON_SVG} />
      <link href="/css/output.css" rel="stylesheet" />
    </head>
    <body class="min-h-screen bg-base-200 flex flex-col">
      <div class="navbar bg-base-100/80 backdrop-blur-sm shadow-xs border-b border-base-200 px-6 sticky top-0 z-10">
        <div class="flex-1 flex items-center gap-3">
          <a href={`${prefix}/`} class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span class="text-lg font-bold tracking-tight">Auth Gateway</span>
          </a>
          <span class="badge badge-soft badge-primary badge-xs">v0.1</span>
        </div>
        <div class="flex-none flex items-center gap-2">
          <span class="text-xs text-base-content/50 hidden sm:inline">Data Gateway</span>
          <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
        </div>
      </div>

      <main class="flex-1">
        {children}
      </main>

      <footer class="text-center text-base-content/25 text-xs py-4">
        WebCube2027 — Auth Gateway
      </footer>

      <script>{raw(STATUS_SCRIPT)}</script>
    </body>
  </html>
  );
};

/**
 * 將 Markdown 轉為完整 HTML 頁面字串
 * 使用 Layout 元件渲染，確保 .md 頁面與 .tsx 頁面外觀完全一致。
 */
export function renderPage(title: string, content: string, lang?: string): string {
  return '<!DOCTYPE html>' + renderToString(
    jsx(Layout, { title, lang },
      jsx('div', { class: 'p-6 max-w-4xl mx-auto w-full' },
        jsx('div', { class: 'prose max-w-none' }, raw(content)),
      ),
    ),
  );
}
