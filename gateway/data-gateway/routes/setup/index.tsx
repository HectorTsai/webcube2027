const SCRIPT = `
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('setup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const errEl = document.getElementById('error');
    const btn = e.target.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> 安裝中…';

    try {
      const r = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          管理員帳號: data.管理員帳號,
          管理員密碼: data.管理員密碼,
          l2: {
            type: data.l2_type || 'sqlite',
            host: data.l2_host || undefined,
            port: data.l2_port ? Number(data.l2_port) : undefined,
            database: data.l2_database || 'webcube',
            username: data.l2_username || undefined,
            password: data.l2_password || undefined,
            filePath: data.l2_filePath || 'l2.db',
          },
        }),
      });
      const res = await r.json();
      if (res.success) {
        document.getElementById('setup-card').classList.add('hidden');
        document.getElementById('done').classList.remove('hidden');
      } else {
        errEl.textContent = res.error || '安裝失敗';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = '開始安裝';
      }
    } catch {
      errEl.textContent = '無法連線至伺服器';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = '開始安裝';
    }
  });

  // L2 類型切換
  const l2Type = document.getElementById('l2_type');
  if (l2Type) {
    l2Type.addEventListener('change', () => {
      const type = l2Type.value;
      document.querySelectorAll('.l2-field').forEach(r => r.classList.add('hidden'));
      if (type === 'sqlite') {
        document.querySelector('.l2-field-sqlite')?.classList.remove('hidden');
      } else {
        document.querySelector('.l2-field-server')?.classList.remove('hidden');
      }
    });
  }
});
`;

import { raw } from 'hono/html';

const SetupPage = () => (
  <html lang="zh-TW" data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>系統安裝 — Data Gateway</title>
      <link rel="icon" type="image/svg+xml" href="/images/webcube.svg" />
      <link href="/css/output.css" rel="stylesheet" />
    </head>
    <body class="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8">
      <div class="max-w-lg w-full">

        <div id="setup-card" class="card bg-base-100 shadow-md">
          <div class="card-body gap-5 py-8 px-6">
            <div class="text-center">
              <h1 class="text-2xl font-bold tracking-tight">系統安裝</h1>
              <p class="text-base-content/50 text-sm mt-1">
                設定資料庫並建立管理員帳號
              </p>
            </div>

            <form id="setup-form" class="flex flex-col gap-4">

              <div class="divider text-xs text-base-content/40">管理員帳號</div>

              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">管理員帳號</span>
                <input name="管理員帳號" type="text" class="input input-bordered w-full" required />
              </label>
              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">管理員密碼</span>
                <input name="管理員密碼" type="password" class="input input-bordered w-full" required />
              </label>

              <div class="divider text-xs text-base-content/40">L2 資料庫連線</div>

              <label class="form-control w-full">
                <span class="label-text text-sm mb-1">資料庫類型</span>
                <select id="l2_type" name="l2_type" class="select select-bordered w-full">
                  <option value="sqlite">SQLite（檔案型，適合開發）</option>
                  <option value="surrealdb">SurrealDB</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </label>

              <div class="l2-field l2-field-sqlite">
                <label class="form-control w-full">
                  <span class="label-text text-sm mb-1">資料庫檔名</span>
                  <input name="l2_filePath" type="text" class="input input-bordered w-full" placeholder="l2.db" value="l2.db" />
                </label>
              </div>

              <div class="l2-field l2-field-server hidden">
                <div class="grid grid-cols-2 gap-3">
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">主機</span>
                    <input name="l2_host" type="text" class="input input-bordered w-full" placeholder="localhost" />
                  </label>
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">埠號</span>
                    <input name="l2_port" type="number" class="input input-bordered w-full" placeholder="3306" />
                  </label>
                </div>
                <label class="form-control w-full mt-3">
                  <span class="label-text text-sm mb-1">資料庫名稱</span>
                  <input name="l2_database" type="text" class="input input-bordered w-full" placeholder="webcube" />
                </label>
                <div class="grid grid-cols-2 gap-3 mt-3">
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">使用者</span>
                    <input name="l2_username" type="text" class="input input-bordered w-full" placeholder="root" />
                  </label>
                  <label class="form-control">
                    <span class="label-text text-sm mb-1">密碼</span>
                    <input name="l2_password" type="password" class="input input-bordered w-full" />
                  </label>
                </div>
              </div>

              <div id="error" class="text-error text-sm hidden mt-1"></div>

              <button type="submit" class="btn btn-primary mt-2">開始安裝</button>
            </form>
          </div>
        </div>

        <div id="done" class="card bg-base-100 shadow-md hidden">
          <div class="card-body items-center text-center gap-4 py-10">
            <div class="text-5xl text-success">&#10003;</div>
            <h2 class="text-xl font-bold">安裝完成</h2>
            <p class="text-base-content/50 text-sm">系統已就緒</p>
            <a href="/admin" class="btn btn-primary btn-sm mt-2">前往管理後台</a>
          </div>
        </div>

      </div>

      <script>{raw(SCRIPT)}</script>
    </body>
  </html>
);

export const GET = (c: any) => {
  const markup = '<!DOCTYPE html>' + (<SetupPage />).toString();
  return c.html(markup);
};
