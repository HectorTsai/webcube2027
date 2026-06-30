// test/超連結.tsx — 超連結方塊測試網頁
//
//   <Cube from="方塊:方塊:超連結" color="primary" size="md" href="#">...</Cube>
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

export default async function LinkTestPage(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">超連結（Link）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:超連結" color="primary" size="md" href="#">'} — 基於容器建構，無底線、支援色彩與尺寸
          </p>
        </header>

        {/* 區塊一：內連文字連結 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            內連文字連結（inline text）
          </h2>
          <div class="p-4 bg-white rounded-lg shadow-sm text-sm text-slate-600 leading-relaxed">
            這是一段包含
            <Cube from="方塊:方塊:超連結" context={c} color="primary" size="xs" href="#colors">超連結</Cube>
            的文字段落，它會和周圍文字保持對齊。
            你也可以使用較大的
            <Cube from="方塊:方塊:超連結" context={c} color="secondary" size="sm" href="#sizes">尺寸</Cube>
            來強調重要連結。
          </div>
        </section>

        {/* 區塊二：色彩主題 */}
        <section class="space-y-4" id="colors">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block" />
            色彩主題（color prop）
          </h2>
          <div class="flex flex-wrap gap-2">
            {colors.map(color => (
              <Cube from="方塊:方塊:超連結" context={c} color={color} size="md" href="#">
                {color}
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊三：尺寸 */}
        <section class="space-y-4" id="sizes">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
            尺寸（size prop）
          </h2>
          <div class="space-y-3">
            {sizes.map(size => (
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-400 w-8 text-right">{size}</span>
                <Cube from="方塊:方塊:超連結" context={c} color="primary" size={size} href="#">
                  {size.toUpperCase()} Link
                </Cube>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊四：外部連結 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            外部連結（target="_blank"）
          </h2>
          <div class="flex flex-wrap gap-3 p-4 bg-white rounded-lg shadow-sm">
            <Cube from="方塊:方塊:超連結" context={c} color="primary" size="md"
              href="https://developer.mozilla.org"
              target="_blank" rel="noopener noreferrer">
              MDN 文件
            </Cube>
            <Cube from="方塊:方塊:超連結" context={c} color="secondary" size="md"
              href="https://deno.com"
              target="_blank" rel="noopener noreferrer">
              Deno 官網
            </Cube>
            <Cube from="方塊:方塊:超連結" context={c} color="info" size="md"
              href="https://hono.dev"
              target="_blank" rel="noopener noreferrer">
              Hono 框架
            </Cube>
          </div>
        </section>

        {/* 區塊五：Disabled 狀態 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            Disabled 狀態（disabled prop）
          </h2>
          <div class="flex flex-wrap gap-3">
            {colors.map(color => (
              <Cube from="方塊:方塊:超連結" context={c} color={color} size="md" disabled={true} href="#">
                {color}
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊六：搭配 Alpine disabled toggle */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-amber-500 rounded-full inline-block" />
            搭配 Alpine 動態切換 disabled
          </h2>
          <div
            x-data="{ locked: false }"
            class="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
          >
            <Cube from="方塊:方塊:超連結" context={c} color="error" size="md"
              disabled={false}
              x-bind:disabled="locked"
              x-bind:data-active="(!locked).toString()"
              x-bind:data-hover="(!locked).toString()"
              href="https://developer.mozilla.org"
              target="_blank" rel="noopener noreferrer"
              x-on:click="if(locked) $event.preventDefault()">
              MDN 文件
            </Cube>
            <button type="button" class="btn btn-sm"
              x-on:click="locked = !locked"
              x-text="locked ? '解鎖' : '鎖定'">鎖定</button>
          </div>
          <p class="text-xs text-slate-400">
            鎖定時自動斷電變灰、游標變禁止符號、點擊無效。
          </p>
        </section>

        {/* 區塊七：使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:超連結" — 基於容器，自動支援色彩/懸停/供電</li>
              <li><strong>color</strong>: primary / secondary / accent / info / success / warning / error / base / neutral</li>
              <li><strong>size</strong>: xs / sm / md / lg / xl — 控制內距與字級</li>
              <li><strong>href</strong>: 連結目標 URL（傳給 {'<a>'} 標籤）</li>
              <li><strong>target</strong>: 可設 "_blank" 開新分頁（會自動傳給 {'<a>'} 標籤）</li>
              <li><strong>disabled</strong>: true / false — 禁用狀態（自動套用 inactive 灰階）</li>
              <li><strong>active</strong>: true / false — 供電狀態（false = neutral 灰階）</li>
              <li><strong>hover</strong>: true / false — 懸停效果</li>
              <li>預設 <strong>無底線</strong>（no-underline），不像原生 {'<a>'} 有預設底線</li>
              <li>可搭配其他原生 {'<a>'} 屬性如 download、rel 等</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
