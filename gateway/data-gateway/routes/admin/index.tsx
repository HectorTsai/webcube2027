import { raw } from 'hono/html';

const SCRIPT = `
async function loadStatus() {
  try {
    const health = await fetch('/health').then(r => r.json());
    const l1El = document.getElementById('l1-status');
    const l2El = document.getElementById('l2-status');
    const healthEl = document.getElementById('health-indicator');
    const badgeEl = document.getElementById('health-badge');

    if (health.l1 === 'connected') {
      l1El.textContent = '\\u2713 已就緒';
      l1El.className = 'stat-value text-lg text-success';
    } else {
      l1El.textContent = '\\u2717 離線';
      l1El.className = 'stat-value text-lg text-error';
    }

    if (health.l2 === 'connected') {
      l2El.textContent = '\\u2713 已就緒';
      l2El.className = 'stat-value text-lg text-success';
    } else {
      l2El.textContent = '\\u2717 離線';
      l2El.className = 'stat-value text-lg text-error';
    }

    const allOk = health.l1 === 'connected' && health.l2 === 'connected';
    if (allOk) {
      healthEl.textContent = '\\u2713 正常';
      healthEl.className = 'stat-value text-lg text-success';
      badgeEl.textContent = '運作中';
      badgeEl.className = 'badge badge-soft badge-success';
    } else {
      healthEl.textContent = '\\u2717 異常';
      healthEl.className = 'stat-value text-lg text-error';
      badgeEl.textContent = '降級';
      badgeEl.className = 'badge badge-soft badge-warning';
    }
  } catch (e) {
    document.getElementById('l1-status').textContent = '\\u2717 無法連線';
    document.getElementById('l1-status').className = 'stat-value text-lg text-error';
    document.getElementById('l2-status').textContent = '\\u2717 無法連線';
    document.getElementById('l2-status').className = 'stat-value text-lg text-error';
    document.getElementById('health-indicator').textContent = '\\u2717 離線';
    document.getElementById('health-indicator').className = 'stat-value text-lg text-error';
    document.getElementById('health-badge').textContent = '離線';
    document.getElementById('health-badge').className = 'badge badge-soft badge-error';
  }
}
loadStatus();
`;

const Page = () => (
  <html lang="zh-TW" data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Data Gateway — WebCube2027</title>
      <link href="/css/output.css" rel="stylesheet" />
    </head>
    <body class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-sm px-6">
        <div class="flex-1 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3" /></svg>
          <span class="text-xl font-bold">Data Gateway</span>
          <span class="badge badge-soft badge-info">v0.1</span>
        </div>
        <div class="flex-none gap-2 flex items-center">
          <a href="/" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            回首頁
          </a>
          <a href="/logout" class="btn btn-ghost btn-sm text-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            登出
          </a>
          <span id="health-badge" class="badge badge-soft badge-warning">檢查中…</span>
        </div>
      </div>

      <main class="max-w-5xl mx-auto p-6 space-y-6">

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">服務狀態</h2>
            <div class="stats stats-vertical sm:stats-horizontal shadow-sm">
              <div class="stat">
                <div class="stat-title">L1 (KV Store)</div>
                <div id="l1-status" class="stat-value text-lg">-</div>
              </div>
              <div class="stat">
                <div class="stat-title">L2 (System DB)</div>
                <div id="l2-status" class="stat-value text-lg">-</div>
              </div>
              <div class="stat">
                <div class="stat-title">服務狀態</div>
                <div id="health-indicator" class="stat-value text-lg">-</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">API Endpoints</h2>
            <div class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>方法</th>
                    <th>路徑</th>
                    <th>說明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><span class="badge badge-success badge-xs">GET</span></td><td class="font-mono text-sm">/health</td><td>健康檢查</td></tr>
                  <tr><td><span class="badge badge-info badge-xs">GET</span></td><td class="font-mono text-sm">/api/:model</td><td>列出某 Collection 的資料（支援 ?field &amp; ?value 過濾）</td></tr>
                  <tr><td><span class="badge badge-info badge-xs">GET</span></td><td class="font-mono text-sm">/api/:model/:id</td><td>取得單筆資料</td></tr>
                  <tr><td><span class="badge badge-warning badge-xs">POST</span></td><td class="font-mono text-sm">/api/:model</td><td>新增資料</td></tr>
                  <tr><td><span class="badge badge-warning badge-xs">PUT</span></td><td class="font-mono text-sm">/api/:model/:id</td><td>更新資料</td></tr>
                  <tr><td><span class="badge badge-error badge-xs">DEL</span></td><td class="font-mono text-sm">/api/:model/:id</td><td>刪除資料</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>

      <footer class="text-center text-base-content/40 text-xs py-4">
        WebCube2027 &mdash; Data Gateway
      </footer>

      <script>{raw(SCRIPT)}</script>
    </body>
  </html>
);

export const GET = (c: any) => {
  // Hono's JSX toString() serialises to HTML string
  const markup = '<!DOCTYPE html>' + (<Page />).toString();
  return c.html(markup);
};
