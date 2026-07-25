/**
 * data-gateway 共用版面
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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3'/%3E%3C/svg%3E";

/** HTML 跳脫 */
function ehtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 所有頁面共用：自動更新 navbar 上的 status-badge */
const STATUS_SCRIPT = `
async function updateStatusBadge() {
  try {
    const r = await fetch('/health').then(r => r.json());
    const el = document.getElementById('status-badge');
    if (r.status === 'ok') {
      el.textContent = '正常運作';
      el.className = 'badge badge-soft badge-success';
    } else {
      el.textContent = '異常';
      el.className = 'badge badge-soft badge-error';
    }
  } catch {
    document.getElementById('status-badge').textContent = '無法連線';
    document.getElementById('status-badge').className = 'badge badge-soft badge-error';
  }
}
updateStatusBadge();
`;

/**
 * Layout 元件 — 提供完整的 HTML 外殼（navbar + 主要區塊 + footer）
 *
 * .tsx 頁面 export default 的元件會自動被 route-loader 用此 Layout 包裹。
 * 頁面元件只需要渲染主要內容，無需自行處理 <html>、<head>、<body>。
 */
export const Layout = ({ title, children }: { title: string; children: any }) => (
  <html lang="zh-TW" data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{ehtml(title)} — Data Gateway</title>
      <link rel="icon" type="image/svg+xml" href={ICON_SVG} />
      <link href="/css/output.css" rel="stylesheet" />
    </head>
    <body class="min-h-screen bg-base-200 flex flex-col">
      <div class="navbar bg-base-100/80 backdrop-blur-sm shadow-xs border-b border-base-200 px-6 sticky top-0 z-10">
        <div class="flex-1 flex items-center gap-3">
          <a href="/" class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3" />
            </svg>
            <span class="text-lg font-bold tracking-tight">Data Gateway</span>
          </a>
          <span class="badge badge-soft badge-primary badge-xs">v0.1</span>
        </div>
        <div class="flex-none flex items-center gap-2">
          <span class="text-xs text-base-content/50 hidden sm:inline">服務狀態</span>
          <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
          <a href="/admin" class="btn btn-soft btn-sm ml-1">管理後台</a>
        </div>
      </div>

      <main class="flex-1">
        {children}
      </main>

      <footer class="text-center text-base-content/25 text-xs py-4">
        WebCube2027 — Data Gateway
      </footer>

      <script>{raw(STATUS_SCRIPT)}</script>
    </body>
  </html>
);

/**
 * 將 Markdown 轉為完整 HTML 頁面字串
 * 使用 Layout 元件渲染，確保 .md 頁面與 .tsx 頁面外觀完全一致。
 */
export function renderPage(title: string, content: string): string {
  return '<!DOCTYPE html>' + renderToString(
    jsx(Layout, { title },
      jsx('div', { class: 'p-6 max-w-4xl mx-auto w-full' },
        jsx('div', { class: 'prose max-w-none' }, raw(content)),
      ),
    ),
  );
}
