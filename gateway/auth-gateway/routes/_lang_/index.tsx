import { raw } from 'hono/html';
import { WaveBackground, GatewayHero, StatusCard, FeatureGrid, TechStackRow } from '@dui/framework';

const SCRIPT = `
// ── 顯示 AccountPool 狀態 ──
async function renderAccountPoolStatus() {
  const el = document.getElementById('account-pool-status');
  if (!el) return;

  let data;
  try {
    const r = await fetch('/api/health').then(r => r.json());
    data = r.account_pool;
  } catch {
    el.innerHTML = '<p class="text-xs text-error">無法取得 pool 狀態</p>';
    return;
  }
  if (!data || !data.status) {
    el.innerHTML = '<p class="text-xs text-base-content/50">尚未初始化</p>';
    return;
  }

  const s = data.status;
   const hitRate = (s.hitRate * 100).toFixed(1);
   const frozenCount = data.frozen_count ?? 0;

   const stat = (label, value, ok) => \`
     <div class="flex flex-col items-center gap-0.5 rounded-lg border border-base-200 bg-base-100/60 py-2">
       <span class="text-sm font-bold \${ok === false ? 'text-error' : ''}">\${value}</span>
       <span class="text-[10px] text-base-content/40">\${label}</span>
     </div>\`;

   const items = (data.items || []).map(it => {
     const badges = [];
     if (it.isDirty) badges.push('<span class="badge badge-soft badge-warning badge-xs">待 flush</span>');
     return \`<div class="flex items-center justify-between gap-2 rounded-lg border border-base-200 bg-base-100/60 px-3 py-2">
       <div class="flex items-center gap-2 min-w-0">
         <span class="font-mono text-xs truncate">\${it.key}</span>
         \${badges.join('')}
       </div>
       <span class="text-[10px] text-base-content/40 shrink-0">\${PoolStatus.itemMeta(it)}</span>
     </div>\`;
   }).join('') || '<p class="text-xs text-base-content/40">目前無快取帳號</p>';

   el.innerHTML = \`
     <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
       \${stat('快取數', s.totalItems)}
       \${stat('凍結中', frozenCount, frozenCount > 0 ? false : undefined)}
       \${stat('命中率', hitRate + '%')}
       \${stat('待 flush', s.dirtyItems, s.dirtyItems > 0 ? false : undefined)}
     </div>
     \${s.isFlushing ? '<p class="text-xs text-warning mt-2">正在 flush…</p>' : ''}
     <div class="space-y-1.5 mt-3">\${items}</div>\`;
}

renderAccountPoolStatus();
`;

const Page = (c: any) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;

  return (
    <div class="relative overflow-x-hidden w-full">

      {/* ── Decorative wave background ── */}
      <WaveBackground />

      {/* ── Content ── */}
      <div class="flex items-center justify-center px-4 py-12 relative z-1">

        <div class="max-w-2xl w-full space-y-6">

          {/* ── Hero card ── */}
          <GatewayHero
            prefix={prefix}
            gatewayName="Auth Gateway"
            tagline="WebCube2027 統一認證入口 — 單一登入、集中管理"
            customMiddle={
              <a id="data-gw-link" href="#" class="btn btn-soft" data-prefix={prefix}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                資料閘道
              </a>
            }
          />

          {/* ── 帳號池狀態卡 ── */}
          <StatusCard title="帳號池狀態" subtitle="AccountPool · 5 次失敗自動凍結 10 分鐘">
            <div id="account-pool-status">
              <div class="flex items-center gap-2 text-xs text-base-content/50">
                <span class="loading loading-spinner loading-xs"></span>
                讀取中…
              </div>
            </div>
          </StatusCard>

          {/* ── Feature cards ── */}
          <FeatureGrid
            features={[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'EdDSA 認證', description: 'Ed25519 非對稱簽章 JWT', color: 'primary' },
              { icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', title: 'SSO 單一登入', description: 'JWT 跨服務統一認證', color: 'secondary' },
              { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', title: '帳號管理', description: '使用者／角色查詢 API', color: 'accent' },
              { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: '多國語言', description: 'Accept-Language 自動偵測回傳', color: 'primary' },
              { icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z', title: 'Provider 擴充', description: '本地帳號／OAuth 可擴充', color: 'secondary' },
              { icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', title: '訪客 JWT', description: '未登入即可取得租戶授權', color: 'accent' },
            ]}
            columns={3}
          />

          {/* ── Tech stack ── */}
          <TechStackRow />

        </div>
      </div>

      {/* ── AccountPool 狀態渲染函式 ── */}
      <script>{raw(SCRIPT)}</script>

      {/* ── 動態設定 data-gw-link 指向 data-gateway ── */}
      <script>{raw(`
        (async function() {
          try {
            const r = await fetch('/api/health').then(r => r.json());
            const link = document.getElementById('data-gw-link');
            if (link && r.data_gateway_url) {
              link.href = r.data_gateway_url;
            }
          } catch {}
        })();
      `)}</script>
    </div>
  );
};

export default Page;