/**
 * GET /login — 重新導向至 auth-gateway 登入頁
 *
 * auth-gateway URL 與自身 URL 皆從環境變數讀取，
 * 不硬編碼任何 port。
 */

import type { Context } from 'hono';

export async function GET(c: Context) {
  const authGwUrl = Deno.env.get('AUTH_GATEWAY_URL');
  if (!authGwUrl) {
    return c.html('AUTH_GATEWAY_URL 未設定', 500);
  }

  // 自身 URL（用於登入後導回）
  const selfUrl = Deno.env.get('AI_GATEWAY_URL');
  if (!selfUrl) {
    return c.html('AI_GATEWAY_URL 未設定', 500);
  }

  const redirectTarget = `${authGwUrl}/login?redirect=${encodeURIComponent(selfUrl)}`;

  return c.html(`<!DOCTYPE html>
<html lang="zh-TW" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>重新導向至登入頁...</title>
  <meta http-equiv="refresh" content="0;url=${redirectTarget}" />
  <link rel="stylesheet" href="/css/output.css" />
</head>
<body class="min-h-screen flex items-center justify-center bg-base-200">
  <div class="text-center">
    <span class="loading loading-spinner loading-lg"></span>
    <p class="mt-4 text-base-content/60">正在前往登入頁面...</p>
  </div>
</body>
</html>`);
}
