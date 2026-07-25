import { raw } from 'hono/html';

const SCRIPT = `
async function loadStatus() {
  try {
    const health = await fetch('/health').then(r => r.json());
    const l1El = document.getElementById('l1-status');
    const l2El = document.getElementById('l2-status');
    const l3El = document.getElementById('l3-status');
    const badgeEl = document.getElementById('status-badge');

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

    if (health.l3 && health.l3.includes('\\u2713')) {
      l3El.textContent = health.l3;
      l3El.className = 'stat-value text-lg text-success';
    } else if (health.l3 && health.l3.includes('\\u2717')) {
      l3El.textContent = health.l3;
      l3El.className = 'stat-value text-lg text-error';
    } else {
      l3El.textContent = health.l3 || '未設定';
      l3El.className = 'stat-value text-lg text-base-content/50';
    }

    const allOk = health.l1 === 'connected' && health.l2 === 'connected';
    if (allOk) {
      badgeEl.textContent = '運作中';
      badgeEl.className = 'badge badge-soft badge-success';
    } else {
      badgeEl.textContent = '降級';
      badgeEl.className = 'badge badge-soft badge-warning';
    }
  } catch (e) {
    document.getElementById('l1-status').textContent = '\\u2717 無法連線';
    document.getElementById('l1-status').className = 'stat-value text-lg text-error';
    document.getElementById('l2-status').textContent = '\\u2717 無法連線';
    document.getElementById('l2-status').className = 'stat-value text-lg text-error';
    document.getElementById('l3-status').textContent = '\\u2717 無法連線';
    document.getElementById('l3-status').className = 'stat-value text-lg text-error';
    document.getElementById('status-badge').textContent = '離線';
    document.getElementById('status-badge').className = 'badge badge-soft badge-error';
  }
}

// ── API 測試工具 ──
async function sendApiRequest() {
  const method = document.getElementById('api-method').value;
  const path = document.getElementById('api-path').value.trim();
  const resultEl = document.getElementById('api-result');
  const statusEl = document.getElementById('api-status');
  const timingEl = document.getElementById('api-timing');
  const responseEl = document.getElementById('api-response');

  if (!path) {
    document.getElementById('api-path').focus();
    return;
  }

  resultEl.classList.remove('hidden');
  responseEl.textContent = '傳送中…';
  statusEl.textContent = '';
  timingEl.textContent = '';

  const options = { method };

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const bodyVal = document.getElementById('api-body').value.trim();
    if (bodyVal) {
      try {
        JSON.parse(bodyVal);
        options.headers = { 'Content-Type': 'application/json' };
        options.body = bodyVal;
      } catch {
        statusEl.textContent = '400 JSON 格式錯誤';
        statusEl.className = 'badge badge-soft badge-error';
        responseEl.textContent = '請求主體的 JSON 格式不正確';
        return;
      }
    }
  }

  const start = performance.now();
  try {
    const res = await fetch(path, options);
    const elapsed = Math.round(performance.now() - start);
    const text = await res.text();

    statusEl.textContent = res.status + ' ' + res.statusText;
    statusEl.className = 'badge badge-soft ' + (res.ok ? 'badge-success' : 'badge-error');
    timingEl.textContent = elapsed + 'ms';

    try {
      responseEl.textContent = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      responseEl.textContent = text || '（無回傳內容）';
    }
  } catch (e) {
    statusEl.textContent = '無法連線';
    statusEl.className = 'badge badge-soft badge-error';
    responseEl.textContent = e.message;
  }
}

// 方法切換時顯示/隱藏 Body 輸入區
document.addEventListener('DOMContentLoaded', () => {
  const methodEl = document.getElementById('api-method');
  if (methodEl) {
    methodEl.addEventListener('change', () => {
      const m = methodEl.value;
      document.getElementById('api-body-wrapper').classList.toggle('hidden', m === 'GET' || m === 'DELETE');
    });
  }
});

loadStatus();
`;

const Page = () => (
  <>
      <div class="space-y-6 p-6 max-w-5xl mx-auto">

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
                <div class="stat-title">L3 (Tenant DB)</div>
                <div id="l3-status" class="stat-value text-lg">-</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">API 測試工具</h2>

            <div class="flex gap-2 items-end flex-wrap">
              <select id="api-method" class="select select-bordered select-sm w-24">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
              <input id="api-path" type="text" class="input input-bordered input-sm flex-1 min-w-[200px]" placeholder="/api/..." />
              <button onclick="sendApiRequest()" class="btn btn-primary btn-sm">發送</button>
            </div>

            <div id="api-body-wrapper" class="hidden mt-2">
              <textarea id="api-body" class="textarea textarea-bordered w-full font-mono text-sm" rows={4} placeholder='請求主體 JSON，例如：&#10;{&#9;"名稱": "範例"}'></textarea>
            </div>

            <div id="api-result" class="hidden mt-3">
              <div class="flex items-center gap-2 mb-1">
                <span id="api-status" class="badge"></span>
                <span id="api-timing" class="text-xs text-base-content/50"></span>
              </div>
              <pre id="api-response" class="bg-base-300 p-3 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto whitespace-pre-wrap"></pre>
            </div>
          </div>
        </div>
      </div>

      <script>{raw(SCRIPT)}</script>
    </>
);

export default Page;
