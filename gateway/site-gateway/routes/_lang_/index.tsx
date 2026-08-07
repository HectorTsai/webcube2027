import { raw } from 'hono/html';
import { WaveBackground, GatewayHero, StatusCard, FeatureGrid, TechStackRow } from '@dui/framework';

const SCRIPT = `
// ── 顯示 SitePool 狀態 ──
async function renderSitePoolStatus() {
  const el = document.getElementById('site-pool-status');
  if (!el) return;

  let data;
  try {
    const r = await fetch('/api/health').then(r => r.json());
    data = r.site_pool;
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

  const stat = (label, value, ok) => \`
    <div class="flex flex-col items-center gap-0.5 rounded-lg border border-base-200 bg-base-100/60 py-2">
      <span class="text-sm font-bold \${ok === false ? 'text-error' : ''}">\${value}</span>
      <span class="text-[10px] text-base-content/40">\${label}</span>
    </div>\`;

  // 剩餘倒數 / ∞ 顯示格式由共用 /pool-status.js 的 PoolStatus 統一提供

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
  }).join('') || '<p class="text-xs text-base-content/40">目前無快取網站</p>';

  el.innerHTML = \`
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      \${stat('快取數', s.totalItems)}
      \${stat('命中率', hitRate + '%')}
      \${stat('待 flush', s.dirtyItems, s.dirtyItems > 0 ? false : undefined)}
      \${stat('已刪除', data.removedCount ?? 0)}
    </div>
    \${s.isFlushing ? '<p class="text-xs text-warning mt-2">正在 flush…</p>' : ''}
    <div class="space-y-1.5 mt-3">\${items}</div>\`;
}

renderSitePoolStatus();
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
            gatewayName="Site Gateway"
            tagline="WebCube2027 租戶中心 — 網站註冊、管理與 L3 連線"
            customMiddle={
              <a id="data-gw-link" href="#" class="btn btn-soft" data-prefix={prefix}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                資料閘道
              </a>
            }
          />

          {/* ── 網站資訊池狀態卡 ── */}
          <StatusCard title="網站資訊池狀態" subtitle="SitePool · 延遲寫入每 5 秒 flush">
            <div id="site-pool-status">
              <div class="flex items-center gap-2 text-xs text-base-content/50">
                <span class="loading loading-spinner loading-xs"></span>
                讀取中…
              </div>
            </div>
          </StatusCard>

          {/* ── Feature cards ── */}
          <FeatureGrid
            features={[
              { icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', title: '網站註冊', description: 'domain 即租戶 ID，自動建立 L3 連線', color: 'primary' },
              { icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', title: '租戶管理', description: 'L2 網站資訊 CRUD，唯一資料表', color: 'secondary' },
              { icon: 'M4 7v10c0 1.657 3.582 3 8 3s8-1.343 8-3V7M4 7c0 1.657 3.582 3 8 3s8-1.343 8-3M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3', title: 'L3 連線', description: 'data-gateway 依網站資訊自動建立租戶 DB', color: 'accent' },
              { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', title: '管理員委託', description: '委託 auth-gateway 建立網站管理員', color: 'primary' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: '快取加速', description: 'SitePool 快取 L2 網站資訊，減少 HTTP 往返', color: 'secondary' },
              { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: '延遲寫入', description: '變更暫存 pool，每 5 秒 batch flush 回 L2', color: 'accent' },
            ]}
            columns={3}
          />

          {/* ── Tech stack ── */}
          <TechStackRow />

        </div>
      </div>

      {/* ── SitePool 狀態渲染函式 ── */}
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
