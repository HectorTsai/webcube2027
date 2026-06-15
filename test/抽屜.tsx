// test/抽屜.tsx — 抽屜方塊測試網頁
//
//   <Cube from="方塊:方塊:抽屜" position="right" state="myDrawer" context={c}>...</Cube>
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

export default async function DrawerTestPage(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">抽屜（Drawer）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:抽屜" position="right" context={c}>'} — variant 自動合併，四方向一鍵切換
          </p>
        </header>

        {/* 區塊一：四方向示範 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block" />
            四方向滑入示範
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { position: "left", state: "leftDemo", color: "primary", label: "左側", arrow: "←" },
              { position: "right", state: "rightDemo", color: "info", label: "右側", arrow: "→" },
              { position: "top", state: "topDemo", color: "success", label: "頂部", arrow: "↑" },
              { position: "bottom", state: "bottomDemo", color: "warning", label: "底部", arrow: "↓" },
            ].map(({ position, state, color, label, arrow }) => (
              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400 tracking-wider">{arrow} {label}滑入</div>
                <button
                  type="button"
                  class={`btn btn-${color} w-full`}
                  x-on:click={`$store.drawers.${state} = true`}
                >開啟{label}抽屜</button>

                <Cube from="方塊:方塊:抽屜" context={c} state={state} position={position} color={color}
                  slots={{
                    header: (
                      <Cube from="div" className="p-4 text-lg font-bold border-b">
                        {label}抽屜
                      </Cube>
                    ),
                    footer: (
                      <Cube from="div" className="p-4 border-t">
                        <button type="button" class={`btn btn-${color} btn-sm w-full`}
                          x-on:click={`$store.drawers.${state} = false`}>關閉</button>
                      </Cube>
                    ),
                  }}
                >
                  <p class="px-4 py-4 text-sm opacity-80">
                    這是從{label}滑入的 Drawer。variant 自動套用 {position} 的 className 與 transition。
                  </p>
                </Cube>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊二：自訂寬度 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
            自訂寬度（覆蓋 variant 預設 width）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { state: "narrowDrawer", width: "220px", label: "窄版 (220px)" },
              { state: "wideDrawer", width: "480px", label: "寬版 (480px)" },
            ].map(({ state, width, label }) => (
              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400 tracking-wider">{label}</div>
                <button type="button" class="btn btn-outline w-full"
                  x-on:click={`$store.drawers.${state} = true`}>開啟{label}</button>

                <Cube from="方塊:方塊:抽屜" context={c} state={state} position="left" width={width}
                  slots={{
                    header: <Cube from="div" className="p-4 text-lg font-bold border-b">{label}</Cube>,
                    footer: (
                      <Cube from="div" className="p-4 border-t">
                        <button type="button" class="btn btn-outline btn-sm"
                          x-on:click={`$store.drawers.${state} = false`}>關閉</button>
                      </Cube>
                    ),
                  }}
                >
                  <p class="px-4 py-4 text-sm opacity-80">
                    寬度由 prop 直接覆蓋：<code>width="{width}"</code>
                  </p>
                </Cube>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊三：footer 示範 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            Footer 關閉按鈕（按鈕固定在抽屜最下方）
          </h2>
          <button type="button" class="btn btn-error"
            x-on:click="$store.drawers.plainContent = true">開啟 Footer 抽屜</button>

          <Cube from="方塊:方塊:抽屜" context={c} state="plainContent" position="right"
            slots={{
              footer: (
                <Cube from="div" className="p-4 border-t">
                  <button type="button" class="btn btn-error btn-sm"
                    x-on:click="$store.drawers.plainContent = false">關閉</button>
                </Cube>
              ),
            }}
          >
            <p class="px-4 py-4 text-sm opacity-80">
              關閉按鈕在 footer slot（shrink-0），永遠固定在抽屜最下方，不會隨內容滾動。
            </p>
          </Cube>
        </section>

        {/* 區塊四：超長內容（overflow-y-auto 測試） */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-amber-500 rounded-full inline-block" />
            超長內容（overflow-y-auto 測試）
          </h2>
          <button type="button" class="btn btn-warning"
            x-on:click="$store.drawers.longContent = true">開啟超長內容</button>

          <Cube from="方塊:方塊:抽屜" context={c} state="longContent" position="left"
            slots={{
              header: <Cube from="div" className="p-4 text-lg font-bold border-b">長篇內容</Cube>,
              footer: (
                <Cube from="div" className="p-4 border-t">
                  <button type="button" class="btn btn-warning btn-sm"
                    x-on:click="$store.drawers.longContent = false">關閉</button>
                </Cube>
              ),
            }}
          >
            <div class="space-y-3 p-4">
              <p class="text-sm opacity-80">Scroll me if you can.</p>
              {[
                "在很久很久以前，有一個王國，王國裡住著各種各樣的人。",
                "村莊裡有一位年輕的鐵匠，名叫阿明。他每天天還沒亮就起床。",
                "有一天，阿明收到了一封來自遠方的信。公主被巨龍困在高山上。",
                "他走過了茂密的森林，翻過了陡峭的山嶺，渡過了寬闊的河流。",
                "阿明終於來到了巨龍的洞穴前。洞穴的入口散發著灼熱的氣息。",
                "巨龍盤踞在洞穴深處，它的身體像一座小山，眼睛像兩團火焰。",
                "阿明集中全力，一劍刺向巨龍左胸沒有鱗片覆蓋的地方。",
                "巨龍倒下了，公主得救了。從此阿明成為了王國的英雄。",
                "如果你能看到這裡，overflow-y-auto 運作正常！",
              ].map((text, i) => (
                <p class="text-sm">{i + 1}. {text}</p>
              ))}
            </div>
          </Cube>
        </section>

        {/* 區塊五：色彩主題示範 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            色彩主題示範（color prop）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { color: "primary", label: "Primary" },
              { color: "secondary", label: "Secondary" },
              { color: "accent", label: "Accent" },
              { color: "info", label: "Info" },
              { color: "success", label: "Success" },
              { color: "warning", label: "Warning" },
              { color: "error", label: "Error" },
              { color: "neutral", label: "Neutral" },
            ].map(({ color, label }, i) => (
              <div class="space-y-2">
                <div class={`text-xs font-bold tracking-wider text-${color}`}>{label}</div>
                <button type="button" class={`btn btn-${color} btn-sm w-full`}
                  x-on:click={`$store.drawers.color${i} = true`}>開啟</button>

                <Cube from="方塊:方塊:抽屜" context={c} state={`color${i}`} position="right" color={color}
                  slots={{
                    header: <Cube from="div" className="p-4 font-bold border-b">{label}</Cube>,
                    footer: (
                      <Cube from="div" className="p-4 border-t">
                        <button type="button" class={`btn btn-${color} btn-sm w-full`}
                          x-on:click={`$store.drawers.color${i} = false`}>關閉</button>
                      </Cube>
                    ),
                  }}
                >
                  <p class="px-4 py-4 text-sm opacity-80">
                    color="{color}" — 抽屜本體用 Container 的 {label} 主題。
                  </p>
                </Cube>
              </div>
            ))}
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
              <li><strong>from</strong>: "方塊:方塊:抽屜" — Cube 自動從 DB 載入定義，variant 自動合併</li>
              <li><strong>position</strong>: "left" | "right" | "top" | "bottom" — 四方向 variant</li>
              <li><strong>state</strong>: Alpine store key（{'$store.drawers.{state}'}），每個抽屜唯一</li>
              <li><strong>slots.header / slots.footer</strong>: 可選的頂部/底部固定區域</li>
              <li><strong>JSX children</strong>: 自動流入 content slot（flex-1 overflow-y-auto）</li>
              <li>背景遮罩自動生成，點擊即關閉</li>
              <li>開啟：<code>x-on:click="$store.drawers.myDrawer = true"</code></li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
