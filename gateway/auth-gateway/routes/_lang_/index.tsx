import { raw } from 'hono/html';

const Page = (c: any) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;

  // 從 L1 或環境變數取得 data-gateway URL
  let dataGwUrl = Deno.env.get('DATA_GATEWAY_URL');
  // (在首次渲染時無法 await，使用客戶端 JS 動態取得 data-gateway URL)

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
                <h1 class="text-3xl font-bold tracking-tight">Auth Gateway</h1>
                <p class="text-base-content/50 text-sm mt-1.5">
                  WebCube2027 統一認證入口 — 單一登入、集中管理
                </p>
              </div>

              <div class="flex items-center gap-2 mt-1">
                <a id="data-gw-link" href="#" class="btn btn-soft btn-outline" data-prefix={prefix}>
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
      </div>

      {/* ── 動態設定 data-gw-link ── */}
      <script>{raw(`
        (async function() {
          try {
            const r = await fetch('/health').then(r => r.json());
            const link = document.getElementById('data-gw-link');
            if (link && r.data_gateway_url) {
              const prefix = link.getAttribute('data-prefix') || '';
              link.href = r.data_gateway_url + prefix + '/admin';
            }
          } catch {}
        })();
      `)}</script>
    </div>
  );
};

export default Page;
