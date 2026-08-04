/**
 * 共用版面
 *
 * Export：
 * - `Layout`    — JSX component（供 .tsx 頁面使用）
 * - `renderPage` — 純字串模板（供 route-loader .md 檔案使用）
 */

import type { FC } from "hono/jsx";

interface Props {
  title?: string;
  theme?: string;
  children?: unknown;
}

export const Layout: FC<Props> = (props) => (
  <html lang="zh-TW" data-theme={props.theme ?? "dark"}>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title ?? "AI 中心"}</title>
      <link rel="stylesheet" href="/css/output.css" />
    </head>
    <body class="min-h-screen bg-base-200">{props.children}</body>
  </html>
);

/**
 * 供 route-loader 將 .md 轉為 HTML 頁面時套用版面
 * 使用純字串模板而非 JSX，避免 dynamic import 的 JSX 編譯問題
 *
 * title 慣例：route-loader 在呼叫前已完成 HTML 跳脫（XSS 防護），此處不得再跳脫
 */
export function renderPage(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="zh-TW" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="/css/output.css" />
</head>
<body class="min-h-screen bg-base-200">${content}</body>
</html>`;
}