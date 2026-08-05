/**
 * data-gateway 共用版面
 *
 * 提供 Layout 元件供 .tsx 頁面共用，以及 renderPage() 供 .md 頁面使用。
 *
 * .tsx 頁面 export default 元件後，route-loader 會自動套用 Layout。
 * .md 頁面由 route-loader 呼叫 renderPage() 轉為完整 HTML。
 *
 * data-gateway 為純資料層，不需登入；navbar 僅顯示服務健康狀態。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { jsx } from 'hono/jsx';
import { raw } from 'hono/html';
import { generatePageCss, alpineScripts } from '@dui/framework';

const ICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3'/%3E%3C/svg%3E";

/** navbar 服務狀態 badge 由 Alpine 元件（routes/static/app.js 的 statusBadge）處理 */

/**
 * Layout 元件 — 提供完整的 HTML 外殼（navbar + 主要區塊 + footer）
 *
 * .tsx 頁面 export default 的元件會自動被 route-loader 用此 Layout 包裹。
 * 頁面元件只需要渲染主要內容，無需自行處理 <html>、<head>、<body>。
 */
export const Layout = async ({ title, children, lang }: { title: string; children: any; lang?: string }) => {
  const prefix = `/${lang || 'zh-tw'}`;
  // children 可能是 JSX 樹（.tsx 頁面）或字串；統一先渲染成 HTML 供掃描 class
  const childrenHtml = typeof children === 'string' ? children : renderToString(children);
  // 兩段式渲染：第一輪以空 <style> 輸出完整 HTML（含 Layout shell 自己的
  // navbar/body 工具類），掃描所有 class 生成 CSS；第二輪回傳含 CSS 的樹。
  let css = '';
  const shell = () => (
  <html lang={lang || 'zh-TW'} data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title} — Data Gateway</title>
      <link rel="icon" type="image/svg+xml" href={ICON_SVG} />
      <style>{raw(css)}</style>
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
          <span class="badge badge-soft badge-primary badge-xs">v1.9</span>
        </div>
        <div class="flex-none flex items-center gap-2">
          <span class="text-xs text-base-content/50 hidden sm:inline">服務狀態</span>
          <span x-data="statusBadge" x-init="check()" class="badge badge-soft" x-bind:class="badgeClass" x-text="badgeText">檢查中…</span>
        </div>
      </div>

      <main class="flex-1">
        {raw(childrenHtml)}
      </main>

      <footer class="text-center text-base-content/25 text-xs py-4">
        WebCube2027 — Data Gateway
      </footer>

      {/* Alpine 載入順序：元件註冊檔（在前）→ runtime（在後） */}
      {raw(alpineScripts('/static/app.js'))}
    </body>
  </html>
  );
  // 第一輪：掃描完整 shell（含 Layout 與 children）的 class → 生成 CSS
  // safelist 補上僅由外部 Alpine 元件檔（app.js）動態套用的 class，
  // 確保即使不出現在頁面 HTML 中也有對應 CSS。
  css = await generatePageCss(renderToString(shell()), {
    safelist: ['badge-success', 'badge-error', 'badge-warning', 'text-error', 'text-warning'],
  });
  // 第二輪：回傳已內聯 CSS 的 JSX 樹
  return shell();
};

/**
 * 將 Markdown 轉為完整 HTML 頁面字串
 * 使用 Layout 元件渲染，確保 .md 頁面與 .tsx 頁面外觀完全一致。
 *
 * title 慣例：route-loader 在呼叫前已完成 HTML 跳脫（XSS 防護），
 * 故以 raw() 標記為「已跳脫」，避免 Layout 的 JSX 再次跳脫造成雙重跳脫。
 */
export async function renderPage(title: string, content: string, lang?: string): Promise<string> {
  const children = jsx('div', { class: 'p-6 max-w-4xl mx-auto w-full' },
    jsx('div', { class: 'prose max-w-none' }, raw(content)),
  );
  // 直接呼叫 async 的 Layout 元件並 await（而非 jsx(Layout, …)），
  // 因為 hono 的 renderToString 不支援 async component 型別，
  // await 後拿到的才是純 JSX 樹，renderToString 才能正確渲染。
  const layoutElement = await Layout({ title: raw(title), lang, children });
  return '<!DOCTYPE html>' + renderToString(layoutElement);
}
