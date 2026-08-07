/**
 * auth-gateway 共用版面
 *
 * 使用 @dui/framework 的 GatewayLayout 產生標準 HTML 外殼，
 * 僅處理 auth-gateway 專屬的 navbar 右側（登入/登出、狀態 badge）
 * 與 renderPage() 供 .md 頁面使用。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { jsx } from 'hono/jsx';
import { raw } from 'hono/html';
import { GatewayLayout, getVersion } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname.replace(/\/$/, ''));
const ICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3E%3C/svg%3E";

/** 更新 navbar 上的 status-badge 與登入/登出按鈕 */
const STATUS_SCRIPT = `
async function authHealthCheck() {
  try {
    const r = await fetch('/api/health').then(r => r.json());
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

async function authCheck() {
  const loginBtn = document.getElementById('btn-login');
  const registerBtn = document.getElementById('btn-register');
  const logoutBtn = document.getElementById('btn-logout');
  const editBtn = document.getElementById('btn-edit');
  const username = document.getElementById('auth-username');
  if (!loginBtn || !logoutBtn) return;
  try {
    const r = await fetch('/api/me').then(r => r.json());
    if (r.authenticated) {
      loginBtn.classList.add('hidden');
      if (registerBtn) registerBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      if (editBtn) editBtn.classList.remove('hidden');
      if (username) {
        const name = r.名稱 || r.帳號;
        username.textContent = name;
        username.classList.remove('hidden');
      }
    }
  } catch { /* 未登入 → 維持顯示登入按鈕 */ }
}

authHealthCheck();
authCheck();
`;

export const Layout = async ({ title, children, lang }: { title: string; children: any; lang?: string }) => {
  const version = await getVersion(ROOT);
  const prefix = `/${lang || 'zh-tw'}`;

  return GatewayLayout({
    title,
    gatewayName: 'Auth Gateway',
    version,
    icon: <img src={ICON_SVG} class="h-6 w-6 text-primary" />,
    lang,
    children,
    navbarRight: (
      <>
        <span class="text-xs text-base-content/50 hidden sm:inline">Data Gateway</span>
        <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
        <span id="auth-username" class="text-xs text-base-content/70 font-medium hidden"></span>
        <a id="btn-edit" href={`${prefix}/edit`} class="btn btn-soft btn-xs hidden">編輯</a>
        <a id="btn-register" href={`${prefix}/register`} class="btn btn-soft btn-xs">註冊</a>
        <a id="btn-login" href={`${prefix}/login`} class="btn btn-soft btn-xs">登入</a>
        <a id="btn-logout" href={`/api/logout?redirect=${encodeURIComponent(`${prefix}/`)}`} class="btn btn-soft btn-outline btn-xs hidden">登出</a>
      </>
    ),
    extraScript: STATUS_SCRIPT,
  });
};

/**
 * 將 Markdown 轉為完整 HTML 頁面字串
 * 使用 Layout 元件渲染，確保 .md 頁面與 .tsx 頁面外觀完全一致。
 */
export async function renderPage(title: string, content: string, lang?: string): Promise<string> {
  const children = jsx('div', { class: 'p-6 max-w-4xl mx-auto w-full' },
    jsx('div', { class: 'prose max-w-none' }, raw(content)),
  );
  const layoutElement = await Layout({ title: raw(title), lang, children });
  return '<!DOCTYPE html>' + renderToString(layoutElement);
}