// test/container2.tsx — Cube 渲染器 + Container fallback 測試網頁
//
// Container 方塊使用 fallback 機制：
//   from: "方塊:方塊:Container" → Cube 委派給 Container.tsx
//   Cube 負責遞迴渲染 children，Container 負責自己的外觀與行為
//
// 這確保 Container 的 active/hover/inactive 邏輯完全由 Container.tsx 處理，
// Cube.tsx 保持通用，不包含特定元件的業務邏輯。

import Cube from '../components/Cube.tsx';
import type 方塊 from '../database/models/方塊.ts';

// ---------- Container 方塊定義（中繼資料 + 參數說明） ----------
const containerDefinition: Partial<方塊> = {
  id: "方塊:方塊:Container",
  from: "方塊:方塊:Container",   // → Cube 查 fallback，委派給 Container.tsx
  args: {
    color: {
      type: "string", description: "色彩主題",
      default: "primary",
      options: ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"],
    },
    width: { type: "string", description: "CSS width", default: "auto" },
    height: { type: "string", description: "CSS height", default: "auto" },
    padding: {
      type: "string", description: "Padding 尺寸",
      default: "md", options: ["none", "xs", "sm", "md", "lg", "xl"],
    },
    active: { type: "boolean", description: "供電狀態", default: true },
    hover: { type: "boolean", description: "允許懸停效果", default: false },
    activeStateName: {
      type: "string", description: "Alpine store 屬性名稱（動態切換）", default: "",
    },
  },
};

// ---------- 測試顏色 ----------
const colors = [
  "primary", "secondary", "accent", "info",
  "success", "warning", "error",
];

// ---------- 測試情境 ----------
const layoutScenarios = [
  { width: "56px", height: "56px", padding: "sm", label: "正方顆粒" },
  { width: "120px", height: "48px", padding: "md", label: "標準條狀" },
  { width: "280px", height: "160px", padding: "lg", label: "卡片區塊" },
];

const contentScenarios = [
  { active: true, hover: true, label: "通電常態 + 允許懸停" },
  { active: false, hover: false, label: "斷電冷卻（應顯示 neutral 色）" },
  { active: true, hover: false, label: "通電常態 + 禁止懸停" },
];

// ---------- 頁面元件 ----------
export default function Container2TestPage() {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-7xl mx-auto space-y-12">

        {/* 頁首 */}
        <header class="border-b border-slate-200 pb-6">
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            Cube 渲染器測試 — Container fallback
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Cube 透過 fallback 委派給 Container.tsx，完整重現 Container 的行為
          </p>
        </header>

        {/* 區塊一：幾何與色彩矩陣 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block"></span>
            幾何尺寸與色彩交互矩陣
          </h2>
          <div class="space-y-4">
            {layoutScenarios.map((scenario) => (
              <div class="border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-3">
                <div class="text-xs font-bold text-slate-400 tracking-wider">
                  規格：{scenario.label} ({scenario.width} × {scenario.height}) — Padding: {scenario.padding}
                </div>
                <div class="flex flex-wrap gap-4 items-start">
                  {colors.map((color) => (
                    <div style={{ width: scenario.width, height: scenario.height, boxSizing: "border-box" }}>
                      <Cube
                        definition={containerDefinition}
                        color={color} padding={scenario.padding} width="100%" height="100%" active={true} hover={true}
                      >
                        <Cube definition={{ from: "div", className: "text-center" }}>
                          <Cube definition={{ from: "span", className: "text-sm font-black tracking-tight capitalize" }}>
                            {color}
                          </Cube>
                        </Cube>
                      </Cube>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊二：狀態實驗 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block"></span>
            內容負載與動態狀態矩陣
          </h2>
          <div class="space-y-4">
            {contentScenarios.map((scenario) => (
              <div class="border border-slate-100 rounded-xl p-5 bg-white shadow-sm space-y-4">
                <div class="text-xs font-bold text-slate-400 tracking-wider">
                  狀態：{scenario.label}
                </div>
                <div class="flex flex-wrap gap-4">
                  {colors.slice(0, 3).map((color) => (
                    <div class="flex-1 min-w-[200px]">
                      <Cube
                        definition={containerDefinition}
                        color={color} className="p-sm rounded-lg" active={scenario.active} hover={scenario.hover}
                      >
                        <Cube definition={{ from: "div", className: "space-y-2" }}>
                          <Cube definition={{ from: "span", className: "text-base font-extrabold capitalize" }}>
                            {`${color} Card`}
                          </Cube>
                          <Cube definition={{ from: "div", className: "text-xs text-center leading-relaxed opacity-90" }}>
                            {`狀態：${scenario.label}`}
                          </Cube>
                        </Cube>
                      </Cube>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊三：Alpine.js 動態同步響應 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-amber-500 rounded-full inline-block"></span>
            Alpine.js 跨元件全域動態同步響應
          </h2>
          <div class="border border-slate-100 rounded-xl p-6 bg-white shadow-sm space-y-6">
            <div class="text-sm text-slate-500 max-w-2xl leading-relaxed">
              使用 <code>activeStateName</code> 啟用 Alpine 動態模式（Container.tsx 原生支援）。
              點擊按鈕切換 store 狀態，Cube 委派給 Container 渲染的容器會即時響應。
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50 p-4 rounded-xl">

              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400">靜態失活對照組</div>
                <Cube
                  definition={containerDefinition}
                  color="neutral" className="p-sm rounded-lg" active={false} hover={false}
                >
                  <Cube definition={{ from: "div", className: "font-bold" }}>
                    斷電對照組
                  </Cube>
                </Cube>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400">Alpine 動態響應組</div>
                <Cube
                  definition={containerDefinition}
                  color="primary" className="p-sm rounded-lg" active={true} activeStateName="btn_active_toggle" hover={false}
                >
                  <Cube definition={{ from: "span", className: "font-bold" }}>
                    點擊右方按鈕切換我
                  </Cube>
                </Cube>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400">全域狀態變壓按鈕</div>
                <button
                  type="button"
                  class="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-slate-900 rounded-xl shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all"
                  x-on:click="$store.Container.btn_active_toggle = !$store.Container.btn_active_toggle"
                >
                  點擊切換
                </button>
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}