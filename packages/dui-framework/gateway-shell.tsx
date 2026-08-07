/** @jsxImportSource hono/jsx */

/**
 * @dui/framework — Gateway 共用 Layout 外殼
 *
 * 提供標準化的 HTML 外殼（navbar + main + footer），所有 Gateway 統一使用，
 * 確保使用者體驗一致。
 *
 * Navbar 結構（依使用者規範）：
 *   左方：名稱（點擊連回自己首頁） + 版本（點擊連到 history）
 *   右方：狀態 + 自定義（如 auth-gateway 的登入/登出）
 *
 * 兩段式 CSS 生成封裝在元件內部，Gateway 只需傳入標題、名稱、版本、內容即可。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { raw } from 'hono/html';
import { generatePageCss } from './unocss.ts';
import { alpineScripts } from './alpine.ts';
import { POOL_STATUS_JS_PATH } from './pool-status.ts';

/** GatewayLayout props */
export interface GatewayLayoutProps {
  /** <title> 後半段會自動加上 " — {gatewayName}" */
  title: string;
  /** Gateway 顯示名稱（如 "Data Gateway"、"Auth Gateway"） */
  gatewayName: string;
  /** 當前語言，用於計算前綴路徑，預設 "zh-tw" */
  lang?: string;
  /** 版本號字串（由各 Gateway 自行呼叫 getVersion 取得後傳入） */
  version: string;
  /** Navbar 圖示（JSX <svg> 元件） */
  icon?: any;
  /** Navbar 右側自定義內容（狀態 badge、登入/登出按鈕等） */
  navbarRight?: any;
  /** 主要內容（JSX 元件或 HTML 字串） */
  children: any;
  /** Footer 文字，預設 "WebCube2027 — {gatewayName}" */
  footerText?: string;
  /** 是否啟用 Alpine.js runtime（注入 <script> 載入） */
  useAlpine?: boolean;
  /** Alpine 元件定義檔路徑，預設 "/static/app.js" */
  alpineSrc?: string;
  /** 在 </body> 前注入的額外 <script> 內容（純 JS 字串，不含 <script> 標籤） */
  extraScript?: string;
  /** UnoCSS safelist 補充（由各 Gateway 依動態 class 傳入） */
  cssSafelist?: string[];
}

/**
 * GatewayLayout — 非同步元件，回傳完整的 HTML 外殼 JSX 樹。
 *
 * 使用方式（在 Gateway 的 _layout.tsx 中）：
 *
 * ```tsx
 * import { GatewayLayout, getVersion } from '@dui/framework';
 *
 * const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname.replace(/\/$/, ''));
 * const ICON = <svg>…</svg>;
 *
 * export const Layout = async ({ title, children, lang }) => {
 *   const version = await getVersion(ROOT);
 *   return GatewayLayout({ title, gatewayName: 'My Gateway', version, icon: ICON, lang, children });
 * };
 * ```
 */
export async function GatewayLayout(props: GatewayLayoutProps) {
  const {
    title,
    gatewayName,
    lang = 'zh-tw',
    version,
    icon,
    navbarRight,
    children,
    footerText,
    useAlpine = false,
    alpineSrc = '/static/app.js',
    extraScript,
    cssSafelist,
  } = props;

  const prefix = `/${lang}`;
  const displayTitle = `${title} — ${gatewayName}`;
  const displayFooter = footerText ?? `WebCube2027 — ${gatewayName}`;

  // 預先將 children 轉為 HTML 字串（供兩段式 CSS 掃描使用）
  const childrenHtml = typeof children === 'string' ? children : renderToString(children);

  let css = '';

  const shell = () => (
    <html lang={lang} data-theme="light">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{displayTitle}</title>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3E%3C/svg%3E" />
        <style>{raw('[x-cloak]{display:none!important}')}{raw(css)}</style>
      </head>
      <body class="min-h-screen bg-base-200 flex flex-col">
        {/* 共用 Pool 顯示 helper（同步載入，先於頁面 inline script 執行） */}
        <script src={POOL_STATUS_JS_PATH}></script>
        {/* ── Navbar ── */}
        <div class="navbar bg-base-100/80 backdrop-blur-sm shadow-xs border-b border-base-200 px-6 sticky top-0 z-10">
          <div class="flex-1 flex items-center gap-3">
            <a href={`${prefix}/`} class="flex items-center gap-2">
              {icon}
              <span class="text-lg font-bold tracking-tight">{gatewayName}</span>
            </a>
            <a href={`${prefix}/history`}>
              <span class="badge badge-soft badge-primary badge-xs">v{version}</span>
            </a>
          </div>
          <div class="flex-none flex items-center gap-2">
            {navbarRight}
          </div>
        </div>

        {/* ── Main Content ── */}
        <main class="flex-1">
          {raw(childrenHtml)}
        </main>

        {/* ── Footer ── */}
        <footer class="text-center text-base-content/25 text-xs py-4">
          {displayFooter}
        </footer>

        {/* ── Scripts ── */}
        {useAlpine && raw(alpineScripts(alpineSrc))}
        {extraScript && (
          <script>{raw(extraScript)}</script>
        )}
      </body>
    </html>
  );

  // 第一輪：掃描完整 shell（含 Layout 與 children）的 class → 生成 CSS
  css = await generatePageCss(renderToString(shell()), {
    safelist: cssSafelist,
  });
  // 第二輪：回傳已內聯 CSS 的 JSX 樹
  return shell();
}