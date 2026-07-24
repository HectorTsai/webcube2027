import { raw } from 'hono/html';

const SCRIPT = `
async function check() {
  try {
    const r = await fetch('/health').then(r => r.json());
    const el = document.getElementById('status-badge');
    if (r.status === 'ok') {
      el.textContent = '\\u2713 已連線';
      el.className = 'badge badge-soft badge-success';
    } else {
      el.textContent = '\\u2717 異常';
      el.className = 'badge badge-soft badge-error';
    }
  } catch {
    document.getElementById('status-badge').textContent = '無法連線';
    document.getElementById('status-badge').className = 'badge badge-soft badge-error';
  }
}
check();
`;

const Landing = ({ dataGwAdminUrl }: { dataGwAdminUrl?: string }) => (
  <html lang="zh-TW" data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Auth Gateway — WebCube2027</title>
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/%3E%3C/svg%3E" />
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
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <span class="text-lg font-bold tracking-tight">Auth Gateway</span>
          <span class="badge badge-soft badge-primary badge-xs">v0.1</span>
        </div>
        <div class="flex-none flex items-center gap-2">
          <span class="text-xs text-base-content/50 hidden sm:inline">Data Gateway</span>
          <span id="status-badge" class="badge badge-soft badge-warning">檢查中…</span>
          <a href="/login" class="btn btn-primary btn-sm ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            登入
          </a>
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
                <h1 class="text-3xl font-bold tracking-tight">Auth Gateway</h1>
                <p class="text-base-content/50 text-sm mt-1.5">
                  WebCube2027 統一認證入口 — 單一登入、集中管理
                </p>
              </div>

              <div class="flex items-center gap-2 mt-1">
                <a href="/login" class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                  前往登入
                </a>
                <a id="data-gw-link" href={dataGwAdminUrl} class="btn btn-soft btn-outline">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Data Gateway
                </a>
              </div>

            </div>
          </div>

          {/* ── Feature cards ── */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
              <div class="card-body items-center text-center py-5 px-4 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <h3 class="font-semibold text-sm">JWT 認證</h3>
                <p class="text-xs text-base-content/50">基於 HS256 簽發與驗證</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
              <div class="card-body items-center text-center py-5 px-4 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-secondary mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                <h3 class="font-semibold text-sm">SSO</h3>
                <p class="text-xs text-base-content/50">跨服務單一登入</p>
              </div>
            </div>
            <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
              <div class="card-body items-center text-center py-5 px-4 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-accent mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <h3 class="font-semibold text-sm">帳號管理</h3>
                <p class="text-xs text-base-content/50">管理員管理使用者</p>
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

      {/* ── Footer ── */}
      <footer class="text-center text-base-content/25 text-xs py-4 relative z-1">
        WebCube2027 &mdash; Auth Gateway
      </footer>

      <script>{raw(SCRIPT)}</script>
    </body>
  </html>
);

export const GET = async (c: any) => {
  // 從 L1 或環境變數取得 data-gateway URL（不硬編碼）
  let dataGwUrl = Deno.env.get('DATA_GATEWAY_URL');
  if (!dataGwUrl) {
    try {
      const { getL1 } = await import('../utils/l1.ts');
      const l1 = getL1();
      const stored = await l1.get('data_gateway_url');
      if (stored) dataGwUrl = stored;
    } catch {
      // L1 尚未就緒
    }
  }
  const dataGwAdminUrl = dataGwUrl ? `${dataGwUrl}/admin` : '#';
  const markup = '<!DOCTYPE html>' + (<Landing dataGwAdminUrl={dataGwAdminUrl} />).toString();
  return c.html(markup);
};
