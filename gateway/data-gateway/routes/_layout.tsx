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

/** 所有頁面共用：自動更新 navbar 上的狀態與按鈕 */
const STATUS_SCRIPT = `
async function updateNavbar() {
  // 服務狀態 badge
  try {
    const r = await fetch('/api/health').then(r => r.json());
    const el = document.getElementById('status-badge');
    if (el) {
      if (r.status === 'ok') {
        el.textContent = '正常運作';
        el.className = 'badge badge-soft badge-success';
      } else {
        el.textContent = '異常';
        el.className = 'badge badge-soft badge-error';
      }
    }
    // 暫存 auth-gateway URL 供登入按鈕使用
    if (r.auth_gateway_url) window.__authGwUrl = r.auth_gateway_url;
  } catch {
    const el = document.getElementById('status-badge');
    if (el) {
      el.textContent = '無法連線';
      el.className = 'badge badge-soft badge-error';
    }
  }

  // 根據登入狀態顯示對應按鈕
  const adminContainer = document.getElementById('nav-admin-container');
  const authContainer = document.getElementById('nav-auth-container');
  if (!adminContainer || !authContainer) return;

  try {
    const r = await fetch('/api/me').then(r => r.json());
    if (r.authenticated) {
      const 角色 = Array.isArray(r.角色) ? r.角色 : [r.角色];
      const prefix = window.location.pathname.match(/^\\/([a-z]{2,3}(-[a-z]{2,4})?)/)?.[0] || '';

      // 管理後台按鈕（超級管理員 → /admin，管理員 → /manager）
      if (角色.includes('使用者:角色:超級管理員')) {
        adminContainer.classList.remove('hidden');
        adminContainer.innerHTML = '<a href="' + prefix + '/admin" class="btn btn-soft btn-sm">管理後台</a>';
      } else if (角色.includes('使用者:角色:管理員')) {
        adminContainer.classList.remove('hidden');
        adminContainer.innerHTML = '<a href="' + prefix + '/manager" class="btn btn-soft btn-sm">管理後台</a>';
      }

      // 登出按鈕（導回首頁，避免被 middleware 攔截）
      authContainer.innerHTML = '<a href="/api/logout?redirect=' + encodeURIComponent(window.location.origin + prefix + '/') + '" class="btn btn-ghost btn-sm">登出</a>';
    } else {
      // 未登入 → 顯示登入按鈕
      const authGwUrl = r.auth_gateway_url || window.__authGwUrl;
      if (authGwUrl) {
        const tenant = window.location.hostname;
        const prefix = window.location.pathname.match(/^\\/([a-z]{2,3}(-[a-z]{2,4})?)/)?.[0] || '';
        authContainer.innerHTML = '<a href="' + authGwUrl + prefix + '/login?tenant=' + encodeURIComponent(tenant) + '" class="btn btn-primary btn-sm">登入</a>';
      }
    }
  } catch {
    // /api/me 失敗 → 不顯示任何按鈕
  }
}
updateNavbar();
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
      <title>{ehtml(title)} — Data Gateway</title>
      <link rel="icon" type="image/svg+xml" href={ICON_SVG} />
      <link href="/css/output.css" rel="stylesheet" />
    </head>
    <body class="min-h-screen bg-base-200 flex flex-col">
      <div class="navbar bg-base-100/80 backdrop-blur-sm shadow-xs border-b border-base-200 px-6 sticky top-0 z-10">
        <div class="flex-1 flex items-center gap-3">
          <a href={`${prefix}/`} class="flex items-center gap-2">
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
          <div id="nav-admin-container" class="hidden"></div>
          <div id="nav-auth-container"></div>
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
