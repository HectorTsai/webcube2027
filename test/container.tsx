// test/container.tsx (2027 究極完全體 - 三態完整測試矩阵版)
import Container, { ContainerProps } from '../components/Container.tsx';

export default async function ContainerTestPage(ctx: any) {
  // 🌈 全域調色盤核心矩陣
  const colors: ContainerProps['color'][] = [
    'primary',
    'secondary',
    'accent',
    'info',
    'success',
    'warning',
    'error',
  ];

  // 📐 幾何與尺寸伸縮測試配置
  const layoutScenarios = [
    { width: '56px', height: '56px', padding: 'sm', label: '正方顆粒', desc: '小圖示容器', layoutType: 'grid' },
    { width: '120px', height: '48px', padding: 'md', label: '標準條狀', desc: '常見按鈕規格', layoutType: 'grid' },
    { width: '280px', height: '160px', padding: 'lg', label: '卡片區塊', desc: '內容控制面板 (自動換行防重疊)', layoutType: 'flex-wrap' },
    { width: '100%', height: 'auto', padding: 'xl', label: '滿版寬彈性高', desc: '外層 RWD 包裹盒 (垂直排列流)', layoutType: 'stack' },
  ];

  // 📝 內容負載極限與動態狀態混合調度配置表（💥 補齊 active=true, hover=false 測試案例 💥）
  const contentScenarios = [
    { active: true, hover: true, label: '⚡️ 滿載常態 + 允許懸停', type: 'text-only', desc: '這是一顆通電常態且支援 Hover 變壓的標準容器卡片。' },
    { active: false, hover: false, label: '❄️ 已斷電冷卻 (不回應 Hover)', type: 'with-opacity-wrapper', desc: '此容器正處於靜態失活狀態，物理熔斷所有滑鼠事件。' },
    { active: true, hover: false, label: '🔒 滿載常態 + 🚫 禁止懸停', type: 'text-only', desc: '這是一顆通電亮色的卡片，但 hover 設為 false，滑鼠滑過去絕對不能有任何變色反應！' }
  ];

  // =========================================================================
  // 🎛️ 矩陣渲染管線一：幾何與核心色彩交互矩陣
  // =========================================================================
  const sizeTestBlocks = layoutScenarios.map(scenario => {
    return (
      <div class="border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-3">
        <div class="text-xs font-bold text-slate-400 tracking-wider">
          📐 規格：{scenario.label} ({scenario.width} × {scenario.height}) — Padding: {scenario.padding}
        </div>
        
        <div class={
          scenario.layoutType === 'grid' ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3' :
          scenario.layoutType === 'flex-wrap' ? 'flex flex-wrap gap-4 items-start' : 'space-y-3'
        }>
          {colors.map(color => (
            <Container 
              color={color} 
              width={scenario.width} 
              height={scenario.height} 
              padding={scenario.padding}
              hover={true}
              active={true}
            >
              <div class="text-center">
                <div class="text-sm font-black tracking-tight capitalize">{color}</div>
                {scenario.width === '100%' && (
                  <p class="text-xs mt-1 max-w-xl opacity-80">{scenario.desc}</p>
                )}
              </div>
            </Container>
          ))}
        </div>
      </div>
    );
  });

  // =========================================================================
  // 🎛️ 矩陣渲染管線二：內容負載與動態狀態矩陣（現在完美輸出三組狀態對比！）
  // =========================================================================
  const contentTestBlocks = contentScenarios.map(scenario => {
    return (
      <div class="border border-slate-100 rounded-xl p-5 bg-white shadow-sm space-y-4">
        <div class="text-xs font-bold text-slate-400 tracking-wider">
          ⚙️ 狀態實驗流：{scenario.label}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {colors.slice(0, 3).map(color => (
            <Container
              color={color}
              width="100%"
              height="auto"
              padding="lg"
              active={scenario.active}
              hover={scenario.hover}
            >
              {scenario.type === 'with-opacity-wrapper' ? (
                <div class="flex items-center gap-2 text-sm font-medium opacity-40">
                  <span>{scenario.label}</span>
                </div>
              ) : (
                <div class="space-y-2">
                  <h3 class="text-base font-extrabold capitalize">{color} Card</h3>
                  <p class="text-xs leading-relaxed opacity-90">{scenario.desc}</p>
                </div>
              )}
            </Container>
          ))}
        </div>
      </div>
    );
  });

  // =========================================================================
  // 👑 最終視圖輸出
  // =========================================================================
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans tracking-normal antialiased">
      <div class="max-w-7xl mx-auto space-y-12">
        
        <header class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">萬能物理外殼核心壓力實驗室</h1>
            <p class="text-sm text-slate-500 mt-1">測試 RWD 伸縮幾何、OKLCH 動態雙軌供電、以及 Alpine.js 物理狀態聯動門禁</p>
          </div>
          <div class="flex gap-2">
            <button 
              class="px-4 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
              onclick="window.location.reload()"
            >
              🔄 刷新實驗電網
            </button>
          </div>
        </header>

        {/* 🚀 區塊一：幾何與核心色彩交互矩陣 */}
        <section class="space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-5 bg-indigo-500 rounded-full"></div>
            <h2 class="text-lg font-black text-slate-800">📐 幾何尺寸與核心色彩交互矩陣 (Size & Color Matrix)</h2>
          </div>
          <div class="space-y-4">
            {sizeTestBlocks}
          </div>
        </section>

        {/* 🚀 區塊二：內容長度與動態狀態壓力測試（包含常態禁止懸停） */}
        <section class="space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-5 bg-emerald-500 rounded-full"></div>
            <h2 class="text-lg font-black text-slate-800">📝 內容負載與動態狀態矩陣 (Content & State Matrix)</h2>
          </div>
          <div class="grid grid-cols-1 gap-6">
            {contentTestBlocks}
          </div>
        </section>

        {/* 🚀 區塊三：追加全新狀態對比觀測所 */}
        <section class="space-y-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-5 bg-amber-500 rounded-full"></div>
            <h2 class="text-lg font-black text-slate-800">🔮 Alpine.js 跨元件全域動態同步響應觀測所</h2>
          </div>
          
          <div class="border border-slate-100 rounded-xl p-6 bg-white shadow-sm space-y-6">
            <div class="text-sm text-slate-500 max-w-2xl leading-relaxed">
              下方展示兩顆完全獨立的組件。當點擊最右側的「切換開關」按鈕時，將會修改 Alpine 全域 Store。
              此時左側的 Container 會在**完全不變更與抖動類名**的前提下，達成物理底色與文字的高速響應。
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50 p-4 rounded-xl">
              
              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400">實驗卡片 A (純靜態失活)</div>
                <Container color="neutral" active={false} width="100%" padding="lg">
                  <div class="font-bold">❄️ 靜態失活對照組</div>
                </Container>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400">實驗卡片 B (Alpine 動態響應組)</div>
                <Container color="primary" active={true} activeStateName="btn_active_toggle" width="100%" padding="lg">
                  <span class="font-bold">點擊右方按鈕切換我</span>
                </Container>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400">全域狀態變壓按鈕</div>
                <button 
                  class="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-slate-900 rounded-xl shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all"
                  x-on:click="$store.Container.btn_active_toggle = !$store.Container.btn_active_toggle"
                >
                  🎛️ 點擊開關物理電網
                </button>
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}