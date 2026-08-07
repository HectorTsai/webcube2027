/**
 * GET /:lang/register — 註冊頁面
 */

import { renderToString } from 'hono/jsx/dom/server';
import { raw } from 'hono/html';

const RegisterContent = ({ lang }: { lang: string }) => {
  const prefix = `/${lang}`;
  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-md w-full max-w-sm">
        <div class="card-body gap-5 py-8 px-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight">註冊帳號</h1>
            <p class="text-base-content/50 text-sm mt-1">建立新帳號以存取服務</p>
          </div>

          <form id="register-form" class="flex flex-col gap-3">
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">帳號</span>
              <input name="帳號" type="text" class="input input-bordered w-full" placeholder="請輸入帳號" required />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">名稱</span>
              <input name="名稱" type="text" class="input input-bordered w-full" placeholder="顯示名稱（選填）" />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">密碼</span>
              <span class="text-xs text-base-content/40 ml-1">（至少 4 個字元）</span>
              <input name="密碼" type="password" class="input input-bordered w-full" placeholder="請輸入密碼" minlength={4} required />
            </label>
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">確認密碼</span>
              <input name="confirm密碼" type="password" class="input input-bordered w-full" placeholder="再次輸入密碼" minlength={4} required />
            </label>

            <div id="error" class="text-error text-sm hidden"></div>
            <div id="success-msg" class="text-success text-sm hidden"></div>

            <button type="submit" class="btn btn-primary mt-2">註冊</button>
          </form>

          <p class="text-center text-xs text-base-content/40">
            已有帳號？
            <a href={`${prefix}/login`} class="link link-primary text-xs">登入</a>
          </p>
        </div>
      </div>

      <script>{raw(`
        (async function() {
          document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('register-form');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.target));
              const errEl = document.getElementById('error');
              const successEl = document.getElementById('success-msg');
              errEl.classList.add('hidden');
              successEl.classList.add('hidden');

              // 檢查密碼一致性
              if (data['密碼'] !== data['confirm密碼']) {
                errEl.textContent = '兩次輸入的密碼不一致';
                errEl.classList.remove('hidden');
                return;
              }

              // 移除 confirm 欄位，不送出
              delete data['confirm密碼'];

              try {
                const r = await fetch('/api/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const res = await r.json();
                if (res.success) {
                  successEl.textContent = '註冊成功！導向登入頁…';
                  successEl.classList.remove('hidden');
                  setTimeout(() => {
                    window.location.href = '${prefix}/login?redirect=${encodeURIComponent(prefix + '/')}';
                  }, 1500);
                } else {
                  errEl.textContent = res.error || '註冊失敗';
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
  const { Layout } = await import('../../_layout.tsx');
  const content = RegisterContent({ lang });
  const layoutElement = await Layout({ title: '註冊帳號', lang, children: content });
  const html = '<!DOCTYPE html>' + renderToString(layoutElement);
  return c.html(html);
};