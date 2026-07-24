const SCRIPT = (dataGwUrl: string) => `
const DATA_GATEWAY_URL = ${JSON.stringify(dataGwUrl)};
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const errEl = document.getElementById('error');

    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const res = await r.json();
      if (res.success) {
        localStorage.setItem('jwt', res.data.token);
        const redirect = new URLSearchParams(window.location.search).get('redirect') || DATA_GATEWAY_URL + '/admin';
        const separator = redirect.includes('?') ? '&' : '?';
        window.location.href = redirect + separator + 'token=' + encodeURIComponent(res.data.token);
      } else {
        errEl.textContent = res.error || '登入失敗';
        errEl.classList.remove('hidden');
      }
    } catch {
      errEl.textContent = '無法連線至認證服務';
      errEl.classList.remove('hidden');
    }
  });
});
`;

import { raw } from 'hono/html';
import { sign } from 'hono/jwt';
import { getKeys } from '../../utils/keys.ts';

/** 匿名 JWT 有效期（秒）— 1 小時 */
const ANONYMOUS_TTL = 3600;

const LoginPage = ({ dataGwUrl }: { dataGwUrl: string }) => (
  <html lang="zh-TW" data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>登入 — Auth Gateway</title>
      <link rel="icon" type="image/svg+xml" href="/images/webcube.svg" />
      <link href="/css/output.css" rel="stylesheet" />
    </head>
    <body class="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-md w-full max-w-sm">
        <div class="card-body gap-5 py-8 px-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight">登入</h1>
            <p class="text-base-content/50 text-sm mt-1">Auth Gateway</p>
          </div>

          <form id="login-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">帳號</span>
              <input name="帳號" type="text" class="input input-bordered w-full" required />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">密碼</span>
              <input name="密碼" type="password" class="input input-bordered w-full" required />
            </label>

            <div id="error" class="text-error text-sm hidden"></div>

            <button type="submit" class="btn btn-primary mt-2">登入</button>
          </form>
        </div>
      </div>

      <script>{raw(SCRIPT(dataGwUrl))}</script>
    </body>
  </html>
);

export const GET = async (c: any) => {
  // 從 L1 或環境變數取得 data-gateway URL（不硬編碼）
  let dataGwUrl = Deno.env.get('DATA_GATEWAY_URL');
  if (!dataGwUrl) {
    try {
      const { getL1 } = await import('../../utils/l1.ts');
      const l1 = getL1();
      const stored = await l1.get('data_gateway_url');
      if (stored) dataGwUrl = stored;
    } catch {
      // L1 尚未就緒
    }
  }

  // 若無 JWT cookie 但有 tenant 參數，自動簽發匿名 JWT 並寫入 cookie
  const cookieHeader = c.req.header('Cookie') || '';
  const hasJwt = /jwt=([^;]+)/.test(cookieHeader);
  const tenant = c.req.query('tenant');

  if (!hasJwt && tenant) {
    try {
      const { privateKey } = getKeys();
      const now = Math.floor(Date.now() / 1000);
      const anonPayload = {
        tenant,
        type: 'anonymous',
        iat: now,
        exp: now + ANONYMOUS_TTL,
      };
      const anonToken = await sign(anonPayload, privateKey, 'EdDSA');
      c.header(
        'Set-Cookie',
        `jwt=${anonToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ANONYMOUS_TTL}`,
      );
    } catch {
      // 簽發失敗不阻擋頁面渲染
    }
  }

  const markup = '<!DOCTYPE html>' + (<LoginPage dataGwUrl={dataGwUrl || '/'} />).toString();
  return c.html(markup);
};
