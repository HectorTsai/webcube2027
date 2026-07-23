/**
 * 登入頁 — 重新導向至 auth-gateway 登入頁
 */

import type { FC } from "hono/jsx";

const 登入頁: FC = () => (
  <html lang="zh-TW" data-theme="dark">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>重新導向至登入頁...</title>
      <meta http-equiv="refresh" content="0;url=http://localhost:8003/login?redirect=http://localhost:8004" />
      <link rel="stylesheet" href="/static/style.css" />
    </head>
    <body class="min-h-screen flex items-center justify-center bg-base-200">
      <div class="text-center">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4 text-base-content/60">正在前往登入頁面...</p>
      </div>
    </body>
  </html>
);

export default 登入頁;