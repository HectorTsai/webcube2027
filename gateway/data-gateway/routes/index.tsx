import { raw } from 'hono/html';

const SCRIPT = `
async function check() {
  try {
    const r = await fetch('/health').then(r => r.json());
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

async function openHealthModal() {
  const modal = document.getElementById('health-modal');
  const content = document.getElementById('health-content');
  content.innerHTML = '<span class="loading loading-spinner loading-md"></span>';
  modal.showModal();

  try {
    const r = await fetch('/health');
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
`;

const Landing = () => (
  <html lang="zh-TW" data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Data Gateway — WebCube2027</title>
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3'/%3E%3C/svg%3E" />
      <link href="/css/output.css" rel="stylesheet" />
      <style>{`.wave-bg { position: fixed; bottom: 0; left: 0; width: 100%; height: 280px; overflow: hidden; z-index: 0; pointer-events: none; } .wave-svg { position: absolute; bottom: 0; width: 200%; animation: wave 18s linear infinite; } .wave-svg:nth-child(1) { animation-duration: 18s; opacity: 0.5; } .wave-svg:nth-child(2) { animation-duration: 24s; opacity: 0.3; animation-direction: reverse; } @keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </head>
    <body class="min-h-screen bg-base-200 flex flex-col relative overflow-x-hidden">

      {/* ── Decorative wave background ── */}
      <div class="wave-bg">
        <svg class="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 200%; height: 100%;">
          <path fill="oklch(var(--p)/0.06)" d="M0,224L80,213C160,203,320,181,480,181C640,181,800,203,960,213C1120,224,1280,224,1360,224L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
        <svg class="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 200%; height: 100%; animation-direction: reverse; animation-duration: 24s; opacity: 0.3;">
          <path fill="oklch(var(--s)/0.08)" d="M0,64L80,85C160,107,320,149,480,165C640,181,800,171,960,149C1120,128,1280,96,1360,80L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>

      {/* ── Navbar ── */}
      <div class="navbar bg-base-100/80 backdrop-blur-sm shadow-xs border-b border-base-200 px-6 sticky top-0 z-10">
        <div class="flex-1 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3" /></svg>
          <span class="text-lg font-bold tracking-tight">Data Gateway</span>
          <span class="badge badge-soft badge-primary badge-xs">v0.1</span>
        </div>
        <div class="flex-none flex items-center gap-2">
          <span class="text-xs text-base-content/50 hidden sm:inline">服務狀態</span>
          <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
        </div>
      </div>

      {/* ── Main content ── */}
      <main class="flex-1 flex items-center justify-center px-4 py-12 relative z-1">

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
                <a href="/admin" class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  管理後台
                </a>
                <button onclick="openHealthModal()" class="btn btn-soft btn-outline">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  Health
                </button>
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
                <p class="text-xs text-base-content/50 pl-7">從 JWT 自動識別 tenant，L3 資料庫自動路由切換，商業資料完全隔離</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                  <h3 class="font-semibold text-sm">安裝即用</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">首次設定自動建立 L2 連線、預設角色、管理員，無縫整合 JWT 認證</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <h3 class="font-semibold text-sm">JWT 金鑰輪換</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">驗證失敗自動清除快取並重新取得最新公鑰，支援無縫輪換</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  <h3 class="font-semibold text-sm">L2 連線加密儲存</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">L2 資料庫連線資訊存入 L1 前以 AES 加密，保護敏感設定</p>
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
                <p class="text-xs text-base-content/50 pl-7">L1（本地 KV）/ L2（系統 DB）/ L3（租戶 DB），統一 @dui/database 介面</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
              <div class="card-body py-4 px-5 gap-1.5">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <h3 class="font-semibold text-sm">內部 API</h3>
                </div>
                <p class="text-xs text-base-content/50 pl-7">專用 Inner API 供 auth-gateway 驗證使用者，不受安裝檢查限制</p>
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
      </main>

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
      <footer class="text-center text-base-content/25 text-xs py-4 relative z-1">
        WebCube2027 &mdash; Data Gateway
      </footer>

      <script>{raw(SCRIPT)}</script>
    </body>
  </html>
);

export const GET = (c: any) => {
  const markup = '<!DOCTYPE html>' + (<Landing />).toString();
  return c.html(markup);
};
