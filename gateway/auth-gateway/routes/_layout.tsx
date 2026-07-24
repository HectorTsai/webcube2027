/**
 * auth-gateway 共用版面
 *
 * 供 route-loader 將 .md 轉為 HTML 頁面時套用。
 * .tsx 頁面各自處理自己的 HTML（不強制使用此 Layout）。
 */

/** 將 Markdown 轉為完整 HTML 頁面字串 */
export function renderPage(title: string, content: string): string {
  const pageTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="zh-TW" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle} — Auth Gateway</title>
  <link href="/css/output.css" rel="stylesheet" />
</head>
<body class="min-h-screen bg-base-200 flex flex-col">
  <div class="navbar bg-base-100/80 backdrop-blur-sm shadow-xs border-b border-base-200 px-6 sticky top-0 z-10">
    <div class="flex-1 flex items-center gap-3">
      <span class="text-lg font-bold tracking-tight">Auth Gateway</span>
      <span class="badge badge-soft badge-primary badge-xs">v0.1</span>
    </div>
  </div>
  <main class="flex-1 p-6 max-w-4xl mx-auto w-full">
    <div class="prose max-w-none">${content}</div>
  </main>
  <footer class="text-center text-base-content/25 text-xs py-4">
    WebCube2027 — Auth Gateway
  </footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}