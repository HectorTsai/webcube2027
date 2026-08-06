// 頁面互動邏輯（服務狀態、DB 狀態、連線池、Health modal）已改為 Alpine 元件，
// 定義於 routes/static/app.js（statusBadge / dbStatus / poolStatus / healthModal）。
import { WaveBackground, GatewayHero, StatusCard, FeatureGrid, TechStackRow } from '@dui/framework';

const Landing = (c?: any) => {
  const lang = c?.get?.('lang') || 'zh-tw';
  const prefix = `/${lang}`;
  return (
    <div x-data="healthModal" class="relative overflow-x-hidden w-full">

      {/* ── Decorative wave background ── */}
      <WaveBackground />

      {/* ── Content ── */}
      <div class="flex items-center justify-center px-4 py-12 relative z-1">

        <div class="max-w-2xl w-full space-y-6">

          {/* ── Hero card — 含匝道列表下拉 ── */}
          <GatewayHero
            prefix={prefix}
            gatewayName="Data Gateway"
            tagline="WebCube2027 資料層代理 — 統一 CRUD API、多租戶隔離、安裝即用"
            showGatewayList={true}
          />

          {/* ── 資料庫狀態卡 ── */}
          <StatusCard title="資料庫狀態" subtitle="L1（SQLite）· L2（系統）· L3（租戶）">
            <div x-data="dbStatus" x-init="check()" class="grid grid-cols-3 gap-3">
              <div class="flex flex-col items-center gap-1.5 rounded-lg border border-base-200 bg-base-100/60 py-3">
                <span class="text-sm font-bold">L1</span>
                <span class="text-xs text-base-content/50">本機 SQLite</span>
                <span class="badge badge-soft" x-bind:class="l1.cls" x-text="l1.text">檢查中…</span>
              </div>
              <div class="flex flex-col items-center gap-1.5 rounded-lg border border-base-200 bg-base-100/60 py-3">
                <span class="text-sm font-bold">L2</span>
                <span class="text-xs text-base-content/50">系統資料庫</span>
                <span class="badge badge-soft" x-bind:class="l2.cls" x-text="l2.text">檢查中…</span>
              </div>
              <div class="flex flex-col items-center gap-1.5 rounded-lg border border-base-200 bg-base-100/60 py-3">
                <span class="text-sm font-bold">L3</span>
                <span class="text-xs text-base-content/50">租戶資料庫</span>
                <span class="badge badge-soft" x-bind:class="l3.cls" x-text="l3.text">檢查中…</span>
              </div>
            </div>
          </StatusCard>

          {/* ── 連線池狀態卡 ── */}
          <StatusCard title="連線池狀態" subtitle="AdapterPool · L1/L2/L3 三層統一管理">
            <div x-data="poolStatus" x-init="check()">
              <template x-if="loading">
                <div class="flex items-center gap-2 text-xs text-base-content/50">
                  <span class="loading loading-spinner loading-xs"></span>
                  讀取中…
                </div>
              </template>
              <template x-if="!loading && error">
                <p class="text-xs text-error" x-text="error"></p>
              </template>
              <template x-if="!loading && !error && !pool">
                <p class="text-xs text-base-content/50">連線池尚未初始化</p>
              </template>
              <template x-if="!loading && !error && pool">
                <div class="space-y-2">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div class="flex flex-col items-center gap-0.5 rounded-lg border border-base-200 bg-base-100/60 py-2">
                      <span class="text-sm font-bold" x-text="pool.status.totalItems"></span>
                      <span class="text-[10px] text-base-content/40">連線數</span>
                    </div>
                    <div class="flex flex-col items-center gap-0.5 rounded-lg border border-base-200 bg-base-100/60 py-2">
                      <span class="text-sm font-bold" x-text="pool.status.persistentItems"></span>
                      <span class="text-[10px] text-base-content/40">常駐連線</span>
                    </div>
                    <div class="flex flex-col items-center gap-0.5 rounded-lg border border-base-200 bg-base-100/60 py-2">
                      <span class="text-sm font-bold" x-text="hitRate()"></span>
                      <span class="text-[10px] text-base-content/40">命中率</span>
                    </div>
                    <div class="flex flex-col items-center gap-0.5 rounded-lg border border-base-200 bg-base-100/60 py-2">
                      <span class="text-sm font-bold" x-bind:class="pool.status.dirtyItems > 0 ? 'text-error' : ''" x-text="pool.status.dirtyItems"></span>
                      <span class="text-[10px] text-base-content/40">未保存</span>
                    </div>
                  </div>
                  <p x-show="pool.status.isFlushing" class="text-xs text-warning">正在 flush…</p>
                  <div class="space-y-1.5">
                    <template x-for="it in pool.items" x-bind:key="it.key">
                      <div class="flex items-center justify-between gap-2 rounded-lg border border-base-200 bg-base-100/60 px-3 py-2">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="font-mono text-xs truncate" x-text="it.key"></span>
                          <span class="badge badge-ghost badge-xs shrink-0" x-text="it.dbType || 'unknown'"></span>
                          <template x-if="it.isPersistent">
                            <span class="badge badge-soft badge-info badge-xs">常駐</span>
                          </template>
                          <template x-if="it.isDirty">
                            <span class="badge badge-soft badge-warning badge-xs">未保存</span>
                          </template>
                        </div>
                        <span class="text-[10px] text-base-content/40 shrink-0" x-text="itemMeta(it)"></span>
                      </div>
                    </template>
                    <template x-if="pool.items.length === 0">
                      <p class="text-xs text-base-content/40">目前無連線</p>
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </StatusCard>

          {/* ── Feature cards ── */}
          <FeatureGrid
            features={[
              { icon: 'M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3', title: '統一資料 API', description: 'RESTful CRUD 介面，所有 Gateway 唯一的資料存取入口', color: 'primary' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: '多租戶隔離', description: 'X-Tenant header 指定租戶，L3 資料庫自動路由切換', color: 'secondary' },
              { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', title: '安裝即用', description: '首次設定自動建立 L2 連線，各 Gateway 自行處理 seed', color: 'accent' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: '連線池管理', description: 'AdapterPool 自動 heartbeat / cleanup / flush，狀態即時呈現', color: 'info' },
              { icon: 'M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3', title: '9 種資料庫支援', description: 'SQLite、Firestore、MongoDB、MySQL、PostgreSQL 等', color: 'warning' },
              { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', title: 'Composite ID', description: '`collection:model:nanoid` 多段式 ID，路由直覺', color: 'primary' },
              { icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', title: '多層儲存架構', description: 'L1（SQLite seed）/ L2（系統 DB）/ L3（租戶 DB）', color: 'secondary' },
              { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', title: '公開 API', description: 'L1/L2/L3 統一 CRUD API 與 /api/health 狀態檢查', color: 'accent' },
            ]}
            columns={2}
          />

          {/* ── Tech stack ── */}
          <TechStackRow />

        </div>
      </div>

      {/* ── Health Modal ── */}
      <dialog x-ref="modal" class="modal">
        <div class="modal-box">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 class="text-lg font-bold mb-4">系統健康狀態</h3>
          <div x-show="loading" class="min-h-[80px] flex items-center justify-center">
            <span class="loading loading-spinner loading-md"></span>
          </div>
          <div x-show="!loading && error" class="min-h-[80px] flex items-center justify-center">
            <p class="text-error" x-text="error"></p>
          </div>
          <template x-if="!loading && data">
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span>服務狀態</span>
                <span class="badge badge-soft" x-bind:class="data.status === 'ok' ? 'badge-success' : 'badge-error'" x-text="data.status === 'ok' ? '正常運作' : '異常'"></span>
              </div>
              <div class="flex items-center gap-2">
                <span>Service</span>
                <code class="text-sm bg-base-200 px-2 py-0.5 rounded" x-text="data.service || '-'"></code>
              </div>
              <div class="flex items-center gap-2">
                <span>L1</span>
                <span class="badge badge-soft" x-bind:class="data.l1 === 'connected' ? 'badge-success' : 'badge-error'" x-text="data.l1"></span>
              </div>
              <div class="flex items-center gap-2">
                <span>L2</span>
                <span class="badge badge-soft" x-bind:class="data.l2 === 'connected' ? 'badge-success' : 'badge-error'" x-text="data.l2"></span>
              </div>
              <div class="flex items-center gap-2">
                <span>L3</span>
                <span class="badge badge-soft" x-bind:class="l3Cls" x-text="l3Text"></span>
              </div>
            </div>
          </template>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default Landing;