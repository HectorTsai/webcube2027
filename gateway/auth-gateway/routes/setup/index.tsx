/**
 * GET /setup — 首次安裝頁面
 */

import type { Context } from 'hono';
import { html } from 'hono/html';

export function GET(c: Context) {
  return c.html(
    <html lang="zh-TW">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>auth-gateway 安裝</title>
        <link rel="stylesheet" href="/css/output.css" />
      </head>
      <body class="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div class="card card-bordered bg-base-100 w-full max-w-lg shadow-xl">
          <div class="card-body p-8">
            <h1 class="card-title text-2xl mb-2">auth-gateway 安裝</h1>
            <p class="text-base-content/70 mb-6">
              請輸入 data-gateway 的服務位置。所有 JWT 簽發與驗證皆需透過 data-gateway
              存取使用者資料。
            </p>

            <form
              id="setupForm"
              method="post"
              action="/api/setup"
              class="flex flex-col gap-4"
            >
              <label class="form-control w-full">
                <span class="label-text mb-1">data-gateway URL</span>
                <input
                  type="url"
                  name="data_gateway_url"
                  placeholder="http://localhost:8002"
                  required
                  class="input input-bordered w-full"
                />
                <span class="label-text-alt mt-1 text-base-content/50">
                  例如 http://data-gateway:8002 或 http://localhost:8002
                </span>
              </label>

              <button type="submit" class="btn btn-primary mt-4">
                完成安裝
              </button>
            </form>

            <div id="errorMsg" class="mt-4 text-error hidden"></div>
          </div>
        </div>

        <script>{html`
          document.getElementById('setupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = form.querySelector('button');
            const errEl = document.getElementById('errorMsg');

            btn.disabled = true;
            btn.textContent = '安裝中…';
            errEl.classList.add('hidden');

            try {
              const fd = new FormData(form);
              const res = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data_gateway_url: fd.get('data_gateway_url') }),
              });
              const data = await res.json();

              if (data.success) {
                window.location.href = '/';
              } else {
                errEl.textContent = data.error || '安裝失敗';
                errEl.classList.remove('hidden');
              }
            } catch (err) {
              errEl.textContent = '連線失敗：' + err.message;
              errEl.classList.remove('hidden');
            } finally {
              btn.disabled = false;
              btn.textContent = '完成安裝';
            }
          });
        `}</script>
      </body>
    </html>,
  );
}