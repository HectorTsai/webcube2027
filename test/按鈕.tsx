// test/按鈕.tsx — 按鈕方塊測試網頁
//
//   <Cube from="方塊:方塊:按鈕" color="primary" size="md">...</Cube>
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

export default async function ButtonTestPage(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">按鈕（Button）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:按鈕" color="primary" size="md">'} — 基於容器建構，支援色彩與尺寸
          </p>
        </header>

        {/* 區塊一：色彩主題 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            色彩主題（color prop）
          </h2>
          <div class="flex flex-wrap gap-2">
            {colors.map(color => (
              <Cube from="方塊:方塊:按鈕" context={c} color={color} size="md">
                {color}
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊二：尺寸 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
            尺寸（size prop）
          </h2>
          <div class="space-y-3">
            {sizes.map(size => (
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400 w-8 text-right">{size}</span>
                <Cube from="方塊:方塊:按鈕" context={c} color="primary" size={size}>
                  {size.toUpperCase()} Button
                </Cube>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊三：Disabled 狀態 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            Disabled 狀態（disabled prop）
          </h2>
          <div class="flex flex-wrap gap-3">
            {colors.map(color => (
              <Cube from="方塊:方塊:按鈕" context={c} color={color} size="md" disabled={true}>
                {color}
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊四：搭配 Alpine click */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            搭配 Alpine click 事件
          </h2>
          <div
            x-data="{ count: 0 }"
            class="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
          >
            <Cube from="方塊:方塊:按鈕" context={c} color="secondary" size="md"
              x-on:click="count--">-1</Cube>
            <span class="text-xl font-mono font-bold min-w-[3ch] text-center" x-text="count">0</span>
            <Cube from="方塊:方塊:按鈕" context={c} color="primary" size="md"
              x-on:click="count++">+1</Cube>
          </div>
        </section>

        {/* 區塊五：搭配 Alpine disabled toggle */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-amber-500 rounded-full inline-block" />
            搭配 Alpine 動態切換 disabled
          </h2>
          <div
            x-data="{ locked: false }"
            class="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
          >
            <Cube from="方塊:方塊:按鈕" context={c} color="error" size="md"
              disabled={false}
              x-bind:disabled="locked"
              x-on:click="alert('clicked!')">
              點擊我
            </Cube>
            <button type="button" class="btn btn-sm"
              x-on:click="locked = !locked"
              x-text="locked ? '解鎖' : '鎖定'">鎖定</button>
          </div>
        </section>

        {/* 區塊六：使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:按鈕" — 基於容器，自動支援色彩/懸停/供電</li>
              <li><strong>color</strong>: primary / secondary / accent / info / success / warning / error / base / neutral</li>
              <li><strong>size</strong>: xs / sm / md / lg / xl — 控制內距與字級</li>
              <li><strong>disabled</strong>: true / false — 禁用狀態（自動套用 inactive 灰階）</li>
              <li><strong>active</strong>: true / false — 供電狀態（false = neutral 灰階）</li>
              <li><strong>hover</strong>: true / false — 懸停效果</li>
              <li>按鈕本身是 {'<button type="button">'} 標籤，可搭配 x-on:click 使用</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
