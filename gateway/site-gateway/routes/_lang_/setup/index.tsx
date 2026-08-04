/**
 * GET /:lang/setup — 安裝設定頁面
 *
 * 安裝者需填入 auth-gateway URL、data-gateway URL 以及 Master Key。
 */

export default function SetupPage({ lang }: { lang?: string }) {
  const prefix = `/${lang || 'zh-tw'}`;
  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-md w-full max-w-md">
        <div class="card-body gap-4 py-8 px-6">
          <div class="text-center">
            <h1 class="text-2xl font-bold tracking-tight">安裝 Site Gateway</h1>
            <p class="text-base-content/50 text-sm mt-1">請填入相依服務的 URL 與 Master Key</p>
          </div>

          <form id="setup-form" class="flex flex-col gap-4">
            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">Auth Gateway URL</span>
              <input name="auth_gateway_url" type="url" class="input input-bordered w-full"
                placeholder="http://localhost:8001" required />
            </label>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">Data Gateway URL</span>
              <input name="data_gateway_url" type="url" class="input input-bordered w-full"
                placeholder="http://localhost:8002" required />
            </label>

            <label class="form-control w-full">
              <span class="label-text text-sm mb-1">Master Key</span>
              <input name="master_key" type="password" class="input input-bordered w-full"
                placeholder="data-gateway 管理員提供的金鑰" required minlength={8} />
              <span class="label-text-alt text-xs text-base-content/50 mt-1">
                由 data-gateway 安裝時設定的 Master Key
              </span>
            </label>

            <div id="error" class="text-error text-sm hidden"></div>

            <button type="submit" class="btn btn-primary mt-2">完成安裝</button>
          </form>

          <script dangerouslySetInnerHTML={{
            __html: `
            document.getElementById('setup-form')?.addEventListener('submit', async (e) => {
              e.preventDefault();
              const form = e.target;
              const data = Object.fromEntries(new FormData(form));
              const errEl = document.getElementById('error');
              try {
                const r = await fetch('${prefix}/../api/setup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const res = await r.json();
                if (res.success) {
                  window.location.href = '${prefix}/';
                } else {
                  errEl.textContent = res.error || '安裝失敗';
                  errEl.classList.remove('hidden');
                }
              } catch {
                errEl.textContent = '無法連線至服務';
                errEl.classList.remove('hidden');
              }
            });
            `
          }} />
        </div>
      </div>
    </div>
  );
}