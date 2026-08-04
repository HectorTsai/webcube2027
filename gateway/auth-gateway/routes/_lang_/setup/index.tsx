/**
 * GET /:lang/setup — 首次安裝頁面
 *
 * 安裝者需填入 data-gateway URL 以及 data-gateway 管理員提供的 Master Key。
 */

import { raw } from 'hono/html';

const Page = (c: any) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  return (
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="card card-bordered bg-base-100 w-full max-w-lg shadow-xl">
        <div class="card-body p-8">
          <h1 class="card-title text-2xl mb-2">auth-gateway 安裝</h1>
          <p class="text-base-content/70 mb-4">
            請輸入 data-gateway 的服務位置以及管理員提供的 Master Key。
            安裝時會自動向 data-gateway 註冊並取得 API Key。
          </p>

          <form id="setupForm" class="flex flex-col gap-4">
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

            <label class="form-control w-full">
              <span class="label-text mb-1">Master Key</span>
              <input
                type="password"
                name="master_key"
                placeholder="data-gateway 管理員提供的金鑰"
                required
                minlength={8}
                class="input input-bordered w-full"
              />
              <span class="label-text-alt mt-1 text-base-content/50">
                由 data-gateway 安裝時設定的 Master Key
              </span>
            </label>

            <div class="divider text-xs text-base-content/40 mt-1">超管理者帳號</div>
            <p class="text-xs text-base-content/50 -mt-3 mb-1">
              建立系統第一個超管理者帳號（角色：超級管理員）
            </p>

            <label class="form-control w-full">
              <span class="label-text mb-1">帳號</span>
              <input
                type="text"
                name="帳號"
                placeholder="admin"
                required
                class="input input-bordered w-full"
              />
            </label>

            <label class="form-control w-full">
              <span class="label-text mb-1">顯示名稱</span>
              <input
                type="text"
                name="名稱"
                placeholder="管理員"
                required
                class="input input-bordered w-full"
              />
              <span class="label-text-alt mt-1 text-base-content/50">
                用於 navbar 與介面顯示
              </span>
            </label>

            <label class="form-control w-full">
              <span class="label-text mb-1">密碼</span>
              <input
                type="password"
                name="密碼"
                placeholder="至少 6 字元"
                required
                minlength={6}
                class="input input-bordered w-full"
              />
              <span class="label-text-alt mt-1 text-base-content/50">
                此為 auth-gateway 的第一個超管理者帳號，安裝完成後請妥善保存
              </span>
            </label>

            <button type="submit" class="btn btn-primary mt-4">
              完成安裝
            </button>
          </form>

          <div id="errorMsg" class="mt-4 text-error hidden"></div>
        </div>
      </div>

      <script>{raw(`
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
              body: JSON.stringify({
                data_gateway_url: fd.get('data_gateway_url'),
                master_key: fd.get('master_key'),
                名稱: fd.get('名稱'),
                帳號: fd.get('帳號'),
                密碼: fd.get('密碼'),
              }),
            });
            const data = await res.json();

            if (data.success) {
              window.location.href = '${prefix}/';
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
      `)}</script>
    </div>
  );
};

export default Page;