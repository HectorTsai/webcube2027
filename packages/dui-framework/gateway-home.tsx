/** @jsxImportSource hono/jsx */

/** @dui/framework — Gateway 首頁共用區塊
 *
 * 提供標準化的首頁區塊元件，確保所有 Gateway 的首頁結構一致：
 *   Hero（Logo + 名稱 + 標語 + 操作按鈕）
 *   StatusCard（服務／資料庫狀態）
 *   FeatureGrid（服務特色卡片）
 *   TechStackRow（技術棧圖示列）
 *   WaveBackground（裝飾波紋背景）
 */

import { raw } from 'hono/html';

// ── Wave Background ──────────────────────────────────────────

/** 裝飾性波紋背景，固定於頁面底部 */
export function WaveBackground() {
  return (
    <>
      <style>{`
.wave-bg { position: fixed; bottom: 0; left: 0; width: 100%; height: 280px; overflow: hidden; z-index: 0; pointer-events: none; }
.wave-svg { position: absolute; bottom: 0; width: 200%; animation: wave 18s linear infinite; }
.wave-svg:nth-child(1) { animation-duration: 18s; opacity: 0.5; }
.wave-svg:nth-child(2) { animation-duration: 24s; opacity: 0.3; animation-direction: reverse; }
@keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
`}</style>
      <div class="wave-bg">
        <svg class="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 200%; height: 100%;">
          <path fill="oklch(var(--p)/0.06)" d="M0,224L80,213C160,203,320,181,480,181C640,181,800,203,960,213C1120,224,1280,224,1360,224L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
        <svg class="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none" style="position: absolute; bottom: 0; width: 200%; height: 100%; animation-direction: reverse; animation-duration: 24s; opacity: 0.3;">
          <path fill="oklch(var(--s)/0.08)" d="M0,64L80,85C160,107,320,149,480,165C640,181,800,171,960,149C1120,128,1280,96,1360,80L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>
    </>
  );
}

// ── Hero Section ─────────────────────────────────────────────

export interface GatewayHeroProps {
  /** 當前語言前綴（如 "/zh-tw"） */
  prefix: string;
  /** Gateway 顯示名稱 */
  gatewayName: string;
  /** 簡短標語（如 "WebCube2027 統一認證入口"） */
  tagline: string;
  /**
   * data-gateway 專用：中間按鈕改為「匝道列表」下拉選單，
   * 動態從 /api/health 的 gateways 欄位取得已註冊 Gateway 列表。
   */
  showGatewayList?: boolean;
  /**
   * 自訂中間按鈕內容（JSX），當 showGatewayList 為 false 時顯示。
   * 例如 auth-gateway 可傳入一個指向 data-gateway 的按鈕。
   */
  customMiddle?: any;
}

/** Hero 區塊 — Logo + 名稱 + 標語 + 固定三按鈕（文件／中間按鈕／版本紀錄） */
export function GatewayHero(props: GatewayHeroProps) {
  const { prefix, gatewayName, tagline, showGatewayList, customMiddle } = props;
  return (
    <div class="card bg-base-100/90 backdrop-blur-sm shadow-md border border-base-200 overflow-visible z-20">
      <div class="card-body items-center text-center gap-5 py-10 px-8">
        <img src="/images/webcube_banner.svg" alt="WebCube2027" class="h-20" />
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{gatewayName}</h1>
          <p class="text-base-content/50 text-sm mt-1.5">{tagline}</p>
        </div>
        <div class="flex items-center gap-2 mt-1">
          {/* 左：文件 */}
          <a href={`${prefix}/doc`} class="btn btn-soft">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            文件
          </a>

          {/* 中：匝道下拉 / 自訂按鈕 / 不顯示 */}
          {showGatewayList ? raw(`
            <div x-data="{ gateways: [], open: false, loaded: false }" class="relative inline-block">
              <button
                x-on:click="if(!loaded){loaded=true;fetch('/api/scan-gateways').then(r=>r.json()).then(d=>{gateways=d.gateways;open=true}).catch(()=>{open=true})}else{open=!open}"
                class="btn btn-soft"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                匝道列表
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div
                x-show="open"
                x-on:click.outside="open = false"
                x-cloak
                class="absolute mt-2 w-56 rounded-lg border border-base-200 bg-base-100 shadow-md z-20"
              >
                <template x-for="g in gateways" x-bind:key="g.name">
                  <a x-bind:href="g.url" class="block px-4 py-2 text-sm hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg" x-text="g.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')"></a>
                </template>
                <p x-show="gateways.length === 0" class="px-4 py-2 text-xs text-base-content/50">載入中…</p>
              </div>
            </div>
          `) : customMiddle ? customMiddle : null}

          {/* 右：版本紀錄 */}
          <a href={`${prefix}/history`} class="btn btn-soft">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            版本紀錄
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Status Card ──────────────────────────────────────────────

export interface StatusCardProps {
  /** 卡片標題（如 "資料庫狀態"、"服務狀態"） */
  title: string;
  /** 標題右側的補充說明（如 "L1（SQLite）· L2（系統）· L3（租戶）"） */
  subtitle?: string;
  /** 卡片內容 */
  children: any;
}

/** 通用狀態卡片 — 標題行 + 自訂內容區 */
export function StatusCard(props: StatusCardProps) {
  const { title, subtitle, children } = props;
  return (
    <div class="card bg-base-100/90 backdrop-blur-sm shadow-md border border-base-200">
      <div class="card-body py-5 px-6 gap-4">
        <div class="flex items-center justify-between">
          <h2 class="font-bold">{title}</h2>
          {subtitle && <span class="text-xs text-base-content/40">{subtitle}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Feature Grid ─────────────────────────────────────────────

export interface FeatureCardItem {
  /** SVG path（不含 <svg> 外層），如 "M12 6.253v13m0-13…" */
  icon: string;
  /** 卡片標題 */
  title: string;
  /** 卡片說明 */
  description: string;
  /** 圖示顏色主題，預設 "primary" */
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'warning' | 'error';
}

export interface FeatureGridProps {
  /** 特色卡片陣列 */
  features: FeatureCardItem[];
  /** 網格欄數，預設 2（sm:2 / lg:3） */
  columns?: 2 | 3;
}

/** 特色卡片網格 — 自動適應 2/3 欄 */
export function FeatureGrid(props: FeatureGridProps) {
  const { features, columns = 2 } = props;
  const gridCols = columns === 3
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-3';
  return (
    <div class={gridCols}>
      {features.map((f) => (
        <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200 min-h-[5rem]">
          <div class="card-body py-4 px-5 gap-1.5">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class={`h-5 w-5 text-${f.color || 'primary'} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={f.icon} />
              </svg>
              <h3 class="font-semibold text-sm">{f.title}</h3>
            </div>
            <p class="text-xs text-base-content/50 pl-7">{f.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tech Stack Row ───────────────────────────────────────────

/** 技術棧圖示列 — Deno + Hono + UnoCSS(Tailwind) + daisyUI */
export function TechStackRow() {
  return (
    <div class="card bg-base-100/70 backdrop-blur-sm shadow-xs border border-base-200">
      <div class="card-body flex-row items-center justify-center gap-6 py-4">
        <img src="/images/deno2.png" alt="Deno" class="h-10 opacity-40 hover:opacity-70 transition-opacity" />
        <span class="text-base-content/20 text-lg font-thin">+</span>
        <img src="/images/hono.jpeg" alt="Hono" class="h-10 rounded opacity-40 hover:opacity-70 transition-opacity" />
        <span class="text-base-content/20 text-lg font-thin">+</span>
        <img src="/images/unocss.png" alt="UnoCSS" class="h-10 rounded opacity-40 hover:opacity-70 transition-opacity" />
        <span class="text-base-content/20 text-lg font-thin">+</span>
        <img src="/images/daisyUI.png" alt="daisyUI" class="h-10 opacity-40 hover:opacity-70 transition-opacity" />
      </div>
    </div>
  );
}