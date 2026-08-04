/**
 * site-gateway 共用版面
 *
 * 提供 Layout 元件供 .tsx 頁面共用，以及 renderPage() 供 .md 頁面使用。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { jsx } from 'hono/jsx';
import { raw } from 'hono/html';

const ICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3'/%3E%3C/svg%3E";

export const Layout = ({ title, children, lang }: { title: string; children: any; lang?: string }) => {
  const prefix = `/${lang || 'zh-tw'}`;
  return (
    <html lang={lang || 'zh-TW'} data-theme="light">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} — Site Gateway</title>
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
              <span class="text-lg font-bold tracking-tight">Site Gateway</span>
            </a>
          </div>
          <div class="flex-none flex items-center gap-2">
            <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
          </div>
        </div>

        <main class="flex-1">
          {children}
        </main>

        <footer class="text-center text-base-content/25 text-xs py-4">
          WebCube2027 — Site Gateway
        </footer>
      </body>
    </html>
  );
};

export function renderPage(title: string, content: string, lang?: string): string {
  return '<!DOCTYPE html>' + renderToString(
    jsx(Layout, { title: raw(title), lang },
      jsx('div', { class: 'p-6 max-w-4xl mx-auto w-full' },
        jsx('div', { class: 'prose max-w-none' }, raw(content)),
      ),
    ),
  );
}