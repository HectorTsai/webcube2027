/**
 * site-gateway 共用版面
 *
 * 使用 @dui/framework 的 GatewayLayout 產生標準 HTML 外殼，
 * navbar 右側顯示 data-gateway 連線狀態 badge。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { jsx } from 'hono/jsx';
import { raw } from 'hono/html';
import { GatewayLayout, getVersion } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname.replace(/\/$/, ''));
const ICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'/%3E%3C/svg%3E";

/** 更新 navbar 上的 status-badge（依 /api/health 的 data-gateway 連線狀態） */
const STATUS_SCRIPT = `
async function siteHealthCheck() {
  const el = document.getElementById('status-badge');
  try {
    const r = await fetch('/api/health').then(r => r.json());
    if (r.status === 'ok' && r.data_gateway?.reachable) {
      el.textContent = '\u2713 已連線';
      el.className = 'badge badge-soft badge-success';
    } else {
      el.textContent = '\u2717 異常';
      el.className = 'badge badge-soft badge-error';
    }
  } catch {
    el.textContent = '無法連線';
    el.className = 'badge badge-soft badge-error';
  }
}

siteHealthCheck();
`;

export const Layout = async ({ title, children, lang }: { title: string; children: any; lang?: string }) => {
  const version = await getVersion(ROOT);

  return GatewayLayout({
    title,
    gatewayName: 'Site Gateway',
    version,
    icon: <img src={ICON_SVG} class="h-6 w-6 text-primary" />,
    lang,
    children,
    navbarRight: (
      <>
        <span class="text-xs text-base-content/50 hidden sm:inline">Data Gateway</span>
        <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
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
