/**
 * GET /:lang/login — 登入頁面
 *
 * 處理匿名 JWT 簽發（無 cookie 但有 tenant 參數時）
 * 並透過 _layout.tsx 的 Layout 元件渲染完整頁面。
 */

import { renderToString } from 'hono/jsx/dom/server';
import { raw } from 'hono/html';
import { sign, verify } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../utils/config.ts';

/** 訪客 JWT 有效期 — 1 小時 */
const VISITOR_TTL = 3600;

/** Login 頁面內容元件（不含 Layout 外殼） */
const LoginContent = ({ lang }: { lang: string }) => {
  const prefix = `/${lang}`;
  return (
    <div class="min-h-screen flex items-center justify-center px-4">
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

      <script>{raw(`
        (async function() {
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
                  // 登入成功後回首頁；僅允許 ?redirect= 指定站內相對路徑（防外部跳轉）
                  // jwt cookie 已由 POST /api/login 的 Set-Cookie 設為 HttpOnly，不需 JS 另設
                  let target = new URLSearchParams(window.location.search).get('redirect');
                  if (!target || !target.startsWith('/')) target = '${prefix}/';
                  const separator = target.includes('?') ? '&' : '?';
                  window.location.href = target + separator + 'token=' + encodeURIComponent(res.data.token);
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
        })();
      `)}</script>
    </div>
  );
};

export const GET = async (c: any) => {
  const lang = c.get('lang') || 'zh-tw';

  // 檢查是否已有「有效」的 JWT cookie；無效（舊金鑰簽發/過期）或無 cookie 時，
  // 自動簽發匿名 JWT 並寫入 cookie，讓登入 POST 能成功提取租戶
  const cookieHeader = c.req.header('Cookie') || '';
  const jwtMatch = cookieHeader.match(/jwt=([^;]+)/);
  let hasValidJwt = false;
  if (jwtMatch) {
    try {
      const { publicKey } = getKeys();
      const payload = await verify(decodeURIComponent(jwtMatch[1]), publicKey, 'EdDSA') as { type?: string };
      if (payload?.type) hasValidJwt = true;
    } catch {
      // cookie 無效 → 視為無 cookie，重新簽發訪客 token
    }
  }
  // tenant 優先取 query 參數，其次從 Host header 推斷（Domain = Tenant ID，不含埠號）
  const tenant = c.req.query('tenant') || (c.req.header('Host') || '').replace(/:\d+$/, '').toLowerCase();

  if (!hasValidJwt && tenant) {
    try {
      const { privateKey } = getKeys();
      const now = Math.floor(Date.now() / 1000);
      // 取得訪客角色權限
      let 權限: Record<string, unknown> = {};
      try {
        const dataGatewayUrl = await getDataGatewayUrl();
        const apiKey = await getDataGatewayApiKey();
        const r = await fetch(`${dataGatewayUrl}/api/l2/使用者:角色:訪客`, {
          headers: { 'X-API-Key': apiKey || '' },
        });
        const res = await r.json();
        if (res.success) 權限 = res.data?.權限 || {};
      } catch {
        // data-gateway 尚未就緒，訪客預設無權限
      }

      const visitorPayload = {
        tenant,
        sub: '使用者:使用者:訪客',
        帳號: '訪客',
        角色: ['使用者:角色:訪客'],
        type: 'visitor',
        權限,
        iat: now,
        exp: now + VISITOR_TTL,
      };
      const visitorToken = await sign(visitorPayload, privateKey, 'EdDSA');
      c.header(
        'Set-Cookie',
        `jwt=${visitorToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${VISITOR_TTL}`,
      );
    } catch {
      // 簽發失敗不阻擋頁面渲染
    }
  }

  // 透過 Layout 渲染完整頁面（Layout 為 async，需先 await 取得純 JSX 樹再 renderToString）
  const { Layout } = await import('../../_layout.tsx');
  const content = LoginContent({ lang });
  const layoutElement = await Layout({ title: '登入', lang, children: content });
  const html = '<!DOCTYPE html>' + renderToString(layoutElement);
  return c.html(html);
};
