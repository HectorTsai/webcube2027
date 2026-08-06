/**
 * data-gateway 共用版面
 *
 * 使用 @dui/framework 的 GatewayLayout 產生標準 HTML 外殼，
 * 僅處理 data-gateway 專屬的 navbar 右側（Alpine 狀態 badge）
 * 與 renderPage() 供 .md 頁面使用。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { jsx } from 'hono/jsx';
import { raw } from 'hono/html';
import { GatewayLayout, getVersion } from '@dui/framework';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname.replace(/\/$/, ''));
const ICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3'/%3E%3C/svg%3E";

export const Layout = async ({ title, children, lang }: { title: string; children: any; lang?: string }) => {
  const version = await getVersion(ROOT);

  return GatewayLayout({
    title,
    gatewayName: 'Data Gateway',
    version,
    icon: <img src={ICON_SVG} class="h-6 w-6 text-primary" />,
    lang,
    children,
    navbarRight: (
      <>
        <span class="text-xs text-base-content/50 hidden sm:inline">服務狀態</span>
        <span x-data="statusBadge" x-init="check()" class="badge badge-soft" x-bind:class="badgeClass" x-text="badgeText">檢查中…</span>
      </>
    ),
    useAlpine: true,
    alpineSrc: '/static/app.js',
    cssSafelist: ['badge-success', 'badge-error', 'badge-warning', 'text-error', 'text-warning'],
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