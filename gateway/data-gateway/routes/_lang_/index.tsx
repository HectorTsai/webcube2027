import { raw } from 'hono/html';

// NOTE: doc 路由依賴 marked（見 deno.json）
const SCRIPT = `
async function check() {
  try {
    const r = await fetch('/api/health').then(r => r.json());
    const el = document.getElementById('status-badge');
    if (r.status === 'ok') {
      el.textContent = '正常運作';
      el.className = 'badge badge-soft badge-success';
    } else {
      el.textContent = '異常';
      el.className = 'badge badge-soft badge-error';
    }
  } catch {
    document.getElementById('status-badge').textContent = '無法連線';
    document.getElementById('status-badge').className = 'badge badge-soft badge-error';
  }
}

// 直接顯示 L1/L2/L3 資料庫狀態
async function renderDbStatus() {
  const rows = {
    l1: document.getElementById('db-l1'),
    l2: document.getElementById('db-l2'),
    l3: document.getElementById('db-l3'),
  };
  try {
    const r = await fetch('/api/health').then(r => r.json());
    const setBadge = (el, text, ok) => {
      if (!el) return;
      el.textContent = text;
      el.className = 'badge badge-soft ' + (ok ? 'badge-success' : 'badge-error');
    };
    setBadge(rows.l1, r.l1 === 'connected' ? '已連線' : '未連線', r.l1 === 'connected');
    setBadge(rows.l2, r.l2 === 'connected' ? '已連線' : '未連線', r.l2 === 'connected');
    if (rows.l3) {
      const s = String(r.l3 || '未設定');
      rows.l3.textContent = s;
      rows.l3.className = 'badge badge-soft ' + (s.includes('✓') ? 'badge-success' : s.includes('✗') ? 'badge-error' : 'badge-soft');
    }
  } catch {
    if (rows.l1) { rows.l1.textContent = '無法連線'; rows.l1.className = 'badge badge-soft badge-error'; }
    if (rows.l2) { rows.l2.textContent = '無法連線'; rows.l2.className = 'badge badge-soft badge-error'; }
    if (rows.l3) { rows.l3.textContent = '無法連線'; rows.l3.className = 'badge badge-soft badge-error'; }
  }
}

// 顯示連線池（AdapterPool）狀態
async function renderPoolStatus() {
  const el = document.getElementById('pool-status');
  if (!el) return;
  let data;
  try {
    const r = await fetch('/api/health').then(r => r.json());
    data = r.pool;
  } catch {
    el.innerHTML = '<p class="text-xs text-error">無法取得連線池狀態</p>';
    return;
  }
  if (!data || !data.status) {
    el.innerHTML = '<p class="text-xs text-base-content/50">連線池尚未初始化</p>';
    return;
  }
  const s = data.status;
  const hitRate = (s.hitRate * 100).toFixed(1);
  const items = (data.items || []).map(it => {
    const badges = [];
    if (it.isPersistent) badges.push('<span class="badge badge-soft badge-info badge-xs">常駐</span>');
    if (it.isDirty) badges.push('<span class="badge badge-soft badge-warning badge-xs">未保存</span>');
    return \`<div class="flex items-center justify-between gap-2 rounded-lg border border-base-200 bg-base-100/60 px-3 py-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="font-mono text-xs truncate">\${it.key}</span>
        <span class="badge badge-ghost badge-xs shrink-0">\${it.dbType || 'unknown'}</span>
        \${badges.join('')}
      </div>
      <span class="text-[10px] text-base-content/40 shrink-0">\${it.accessCount} 次存取 · 閒置 \${Math.max(0, Math.round(it.idleMs / 1000))}s</span>
    </div>\`;
  }).join('') || '<p class="text-xs text-base-content/40">目前無連線</p>';

  const stat = (label, value, ok) => \`
    <div class="flex flex-col items-center gap-0.5 rounded-lg border border-base-200 bg-base-100/60 py-2">
      <span class="text-sm font-bold \${ok === false ? 'text-error' : ''}">\${value}</span>
      <span class="text-[10px] text-base-content/40">\${label}</span>
    </div>\`;

  el.innerHTML = \`
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      \${stat('連線數', s.totalItems)}
      \${stat('常駐連線', s.persistentItems)}
      \${stat('命中率', hitRate + '%')}
      \${stat('未保存', s.dirtyItems, s.dirtyItems > 0 ? false : undefined)}
    </div>
    \${s.isFlushing ? '<p class="text-xs text-warning mt-2">正在 flush…</p>' : ''}
    <div class="space-y-1.5 mt-3">\${items}</div>\`;
}

async function openHealthModal() {
  const modal = document.getElementById('health-modal');
  const content = document.getElementById('health-content');
  content.innerHTML = '<span class="loading loading-spinner loading-md"></span>';
  modal.showModal();

  try {
    const r = await fetch('/api/health');
    const data = await r.json();
    const ok = data.status === 'ok';
    content.innerHTML = \`
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <span>服務狀態</span>
          <span class="badge badge-soft \${ok ? 'badge-success' : 'badge-error'}">\${ok ? '正常運作' : '異常'}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>Service</span>
          <code class="text-sm bg-base-200 px-2 py-0.5 rounded">\${data.service || '-'}</code>
        </div>
        <div class="flex items-center gap-2">
          <span>L1</span>
          <span class="badge badge-soft \${data.l1 === 'connected' ? 'badge-success' : 'badge-error'}">\${data.l1}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>L2</span>
          <span class="badge badge-soft \${data.l2 === 'connected' ? 'badge-success' : 'badge-error'}">\${data.l2}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>L3</span>
          <span class="badge badge-soft \${data.l3?.includes('✓') ? 'badge-success' : data.l3?.includes('✗') ? 'badge-error' : 'badge-soft'}">\${data.l3 || '未設定'}</span>
        </div>
      </div>
    \`;
  } catch {
    content.innerHTML = '<p class="text-error">無法連線至伺服器</p>';
  }
}

check();
renderDbStatus();
renderPoolStatus();
`;

const Landing = (c?: any) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  return (
      <div class="relative overflow-x-hidden w-full">

      {/* ── Decorative wave background ── */}
      <style>{`.wave-bg { position: fixed; bottom: 0; left: 0; width: 100%; height: 280px; overflow: hidden; z-index: 0; pointer-events: none; } .wave-svg { position: absolute; bottom: 0; width: 200%; animation: wave 18s linear infinite; } .wave-svg:nth-child(1) { animation-duration: 18s; opacity: 0.5; } .wave-svg:nth-child(2) { animation-duration: 24s; opacity: 0.3; animation-direction: reverse; } @keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      <div class="wave-bg">
        <svg class="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 200%; height: 100%;">
          <path fill="oklch(var(--p)/0.06)" d="M0,224L80,213C160,203,320,181,480,181C640,181,800,203,960,213C1120,224,1280,224,1360,224L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
        <svg class="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 200%; height: 100%; animation-direction: reverse; animation-duration: 24s; opacity: 0.3;">
          <path fill="oklch(var(--s)/0.08)" d="M0,64L80,85C160,107,320,149,480,165C640,181,800,171,960,149C1120,128,1280,96,1360,80L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>

      {/* ── Content ── */}
      <div class="flex items-center justify-center px-4 py-12 relative z-1">

        <div class="max-w-2xl w-full space-y-6">

          {/* ── Hero card ── */}
          <div class="card bg-base-100/90 backdrop-blur-sm shadow-md border border-base-200">
            <div class="card-body items-center text-center gap-5 py-10 px-8">

              <img src="/images/webcube_banner.svg" alt="WebCube2027" class="h-20" />

              <div>
                <h1 class="text-3xl font-bold tracking-tight">Data Gateway</h1>
                <p class="text-base-content/50 text-sm mt-1.5">
                  WebCube2027 資料層代理 — 統一 CRUD API、多租戶隔離、安裝即用
                </p>
              </div>

              <div class="flex items-center gap-2 mt-1">
                <a href={`${prefix}/doc`} class="btn btn-soft">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  文件
                </a>
                <button onclick="openHealthModal()" class="btn btn-soft btn-outline">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  Health
                </button>
              </div>

            </div>
          </div>

          {/* ── 資料庫狀態卡 ── */}
          <div class="card bg-base-100/90 backdrop-blur-sm shadow-md border border-base-200">
            <div class="card-body py-5 px-6 gap-4">
              <div class="flex items-center justify-between">
                <h2 class="font-bold">資料庫狀態</h2>
                <span class="text-xs text-base-content/40">L1（SQLite）· L2（系統）· L3（租戶）</span>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div class="flex flex-col items-center gap-1.5 rounded-lg border border-base-200 bg-base-100/60 py-3">
                  <span class="text-sm font-bold">L1</span>
                  <span class="text-xs text-base-content/50">本機 SQLite</span>
                  <span id="db-l1" class="badge badge-soft badge-warning">檢查中…</span>
                </div>
                <div class="flex flex-col items-center gap-1.5 rounded-lg border border-base-200 bg-base-100/60 py-3">
                  <span class="text-sm font-bold">L2</span>
                  <span class="text-xs text-base-content/50">系統資料庫</span>
                  <span id="db-l2" class="badge badge-soft badge-warning">檢查中…</span>
                </div>
                <div class="flex flex-col items-center gap-1.5 rounded-lg border border-base-200 bg-base-100/60 py-3">
                  <span class="text-sm font-bold">L3</span>
                  <span class="text-xs text-base-content/50">租戶資料庫</span>
                  <span id="db-l3" class="badge badge-soft badge-warning">檢查中…</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 連線池狀態卡 ── */}
          <div class="card bg-base-100/90 backdrop-blur-sm shadow-md border border-base-200">
            <div class="card-body py-5 px-6 gap-4">
              <div class="flex items-center justify-between">
                <h2 class="font-bold">連線池狀態</h2>
                <span class="text-xs text-base-content/40">AdapterPool · L2 SYSTEM + L3 租戶連線</span>
              </div>
              <div id="pool-status">
                <div class="flex items-center gap-2 text-xs text-base-content/50">
                  <span class="loading loading-spinner loading-xs"></span>
                  讀取中…
                </div>
              </div>
            </div>
          </div>

          {/* ── Feature cards ── */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3"/></svg>
                  <h3 class="font-semibold text-sm">統一資料 API</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">RESTful CRUD 介面，所有 Gateway 唯一的資料存取入口</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <h3 class="font-semibold text-sm">多租戶隔離</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">X-Tenant header 指定租戶，L3 資料庫自動路由切換，商業資料完全隔離</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                  <h3 class="font-semibold text-sm">安裝即用</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">首次設定自動建立 L2 連線，各 Gateway 自行處理自己的 seed</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <h3 class="font-semibold text-sm">連線池管理</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">AdapterPool 自動 heartbeat / cleanup / flush，狀態即時於首頁呈現</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3"/></svg>
                  <h3 class="font-semibold text-sm">9 種資料庫支援</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">SQLite、Firestore、MongoDB、MySQL、PostgreSQL 等 9 種 Adapter</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  <h3 class="font-semibold text-sm">Composite ID</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">`collection:model:nanoid` 多段式 ID，路由直覺、擴充彈性</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                  <h3 class="font-semibold text-sm">多層儲存架構</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">L1（SQLite seed）/ L2（系統 DB）/ L3（租戶 DB），統一 @dui/database 介面</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <h3 class="font-semibold text-sm">公開 API</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">L1/L2/L3 統一 CRUD API 與 /api/health 狀態檢查，X-API-Key 驗證</p>
              </div>
            </div>
          </div>

          {/* ── Tech stack ── */}
          <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
            <div class="card-body flex-row items-center justify-center gap-6 py-4">
              <img src="/images/deno2.png" alt="Deno" class="h-10 opacity-40 hover:opacity-70 transition-opacity" />
              <span class="text-base-content/20 text-lg font-thin">+</span>
              <img src="/images/hono.jpeg" alt="Hono" class="h-10 rounded opacity-40 hover:opacity-70 transition-opacity" />
              <span class="text-base-content/20 text-lg font-thin">+</span>
              <img src="/images/tailwind-css.png" alt="Tailwind" class="h-10 opacity-40 hover:opacity-70 transition-opacity" />
              <span class="text-base-content/20 text-lg font-thin">+</span>
              <img src="/images/daisyUI.png" alt="daisyUI" class="h-10 opacity-40 hover:opacity-70 transition-opacity" />
            </div>
          </div>

        </div>
      </div>

      {/* ── Health Modal ── */}
      <dialog id="health-modal" class="modal">
        <div class="modal-box">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 class="text-lg font-bold mb-4">系統健康狀態</h3>
          <div id="health-content" class="min-h-[80px] flex items-center justify-center">
            <span class="loading loading-spinner loading-md"></span>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ── Footer ── */}
      <script>{raw(SCRIPT)}</script>
    </div>
  );
};

export default Landing;
