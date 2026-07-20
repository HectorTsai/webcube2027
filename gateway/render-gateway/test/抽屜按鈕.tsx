// test/抽屜按鈕.tsx — 抽屜按鈕方塊測試網頁
//
//   <Cube from="方塊:方塊:抽屜按鈕" state="myDrawer" context={c}>...</Cube>
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

export default async function DrawerButtonTestPage(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">抽屜按鈕（Drawer Button）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:抽屜按鈕" state="..." context={c}>'} — 點擊觸發抽屜面板
          </p>
        </header>

        {/* 區塊一：基本使用 — 預設頭像圖示 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block" />
            基本使用（預設頭像圖示）
          </h2>
          <p class="text-sm text-slate-500">點擊按鈕開啟右側抽屜，背景點擊可關閉</p>
          <div class="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm">
            <Cube from="方塊:方塊:抽屜按鈕" context={c}
              state="basicDrawer"
              color="primary"
              size="md"
            >
              <Cube from="方塊:方塊:div" context={c} className="p-6">
                <h3 class="text-lg font-bold mb-2">基本抽屜內容</h3>
                <p class="text-sm opacity-80">這是從右側滑入的抽屜面板，點擊背景或按下關閉按鈕即可關閉。</p>
                <div class="mt-4 flex flex-col gap-2">
                  <Cube from="方塊:方塊:超連結" context={c} color="primary" size="sm" href="#">選項一</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="primary" size="sm" href="#">選項二</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="primary" size="sm" href="#">選項三</Cube>
                </div>
              </Cube>
            </Cube>
            <span class="text-sm text-slate-400">點擊頭像圖示開啟</span>
          </div>
        </section>

        {/* 區塊二：尺寸變化 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
            尺寸變化（size prop）
          </h2>
          <div class="flex items-end gap-4 p-6 bg-white rounded-xl shadow-sm flex-wrap">
            {sizes.map(size => (
              <div class="flex flex-col items-center gap-2">
                <span class="text-xs text-slate-400">{size}</span>
                <Cube from="方塊:方塊:抽屜按鈕" context={c}
                  state={`size${size}Drawer`}
                  color="primary"
                  size={size}
                >
                  <Cube from="方塊:方塊:div" context={c} className="p-6">
                    <p class="text-sm">size="{size}" 的抽屜內容</p>
                  </Cube>
                </Cube>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊三：色彩主題 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            色彩主題（color prop）
          </h2>
          <div class="flex flex-wrap gap-3 p-6 bg-white rounded-xl shadow-sm">
            {colors.map((color, i) => (
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state={`color${i}Drawer`}
                color={color}
                size="md"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6">
                  <p class="text-sm">color="{color}" 主題的抽屜內容</p>
                </Cube>
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊四：多個抽屜按鈕共存 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            多個抽屜按鈕共存（各自獨立 state）
          </h2>
          <div class="flex items-center gap-6 p-6 bg-white rounded-xl shadow-sm">
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">使用者選單</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="userMenuDrawer"
                color="secondary"
                size="lg"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6 space-y-3">
                  <h3 class="text-lg font-bold">使用者設定</h3>
                  <Cube from="方塊:方塊:超連結" context={c} color="secondary" size="sm" href="#">個人資料</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="secondary" size="sm" href="#">帳號設定</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="secondary" size="sm" href="#">隱私權</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="secondary" size="sm" href="#">登出</Cube>
                </Cube>
              </Cube>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">通知中心</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="notificationDrawer"
                color="accent"
                size="lg"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6 space-y-3">
                  <h3 class="text-lg font-bold">通知</h3>
                  <div class="text-sm opacity-80 p-3 bg-slate-100 rounded-lg">您有 3 則未讀訊息</div>
                  <div class="text-sm opacity-80 p-3 bg-slate-100 rounded-lg">系統更新已完成</div>
                </Cube>
              </Cube>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">設定</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="settingsDrawer"
                color="info"
                size="lg"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6 space-y-3">
                  <h3 class="text-lg font-bold">網站設定</h3>
                  <div class="text-sm">語言、主題、通知偏好等設定選項。</div>
                </Cube>
              </Cube>
            </div>
          </div>
        </section>

        {/* 區塊五：Disabled 狀態 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-slate-500 rounded-full inline-block" />
            Disabled 狀態（disabled prop）
          </h2>
          <p class="text-sm text-slate-500">禁用狀態下點擊無效，視覺自動灰階</p>
          <div class="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm">
            <Cube from="方塊:方塊:抽屜按鈕" context={c}
              state="disabledDrawer"
              color="primary"
              size="md"
              disabled={true}
            >
              <Cube from="方塊:方塊:div" context={c} className="p-6">
                <p class="text-sm">這個抽屜不會被打開（disabled）</p>
              </Cube>
            </Cube>
            <span class="text-sm text-slate-400">已禁用，點擊無反應</span>
          </div>
        </section>

        {/* 區塊七：抽屜內含豐富內容 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            抽屜內含豐富內容
          </h2>
          <p class="text-sm text-slate-500">在 drawer slot 中放入各種方塊組合</p>
          <div class="flex items-center gap-6 p-6 bg-white rounded-xl shadow-sm">
            <Cube from="方塊:方塊:抽屜按鈕" context={c}
              state="richDrawer"
              color="primary"
              size="xl"
            >
              <Cube from="方塊:方塊:div" context={c} className="p-6 space-y-4">
                <Cube from="方塊:方塊:頭像" context={c} color="accent" size="3xl" />
                <h3 class="text-xl font-bold">使用者名稱</h3>
                <p class="text-sm opacity-60">user@example.com</p>
                <Cube from="方塊:方塊:分隔線" context={c} color="current" />
                <div class="space-y-2">
                  <Cube from="方塊:方塊:超連結" context={c} color="base" size="md" href="#">📋 我的訂單</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="base" size="md" href="#">❤️ 收藏清單</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="base" size="md" href="#">⚙️ 帳號設定</Cube>
                  <Cube from="方塊:方塊:超連結" context={c} color="base" size="md" href="#">🚪 登出</Cube>
                </div>
              </Cube>
            </Cube>
            <span class="text-sm text-slate-400">含有頭像、連結選單的豐富抽屜內容</span>
          </div>
        </section>

        {/* 區塊八：自訂圖示類型 — SVG / src / 其他圖示 ID */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-pink-500 rounded-full inline-block" />
            自訂觸發圖示（text/svg / src / id）
          </h2>
          <p class="text-sm text-slate-500">透過 JSX children 傳入不同的圖示類型，取代預設的使用者圖示</p>
          <div class="flex items-center gap-6 p-6 bg-white rounded-xl shadow-sm flex-wrap">
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">文字按鈕</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="textDrawer"
                color="primary"
                size="md"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6">
                  <p class="text-sm">文字按鈕觸發的抽屜</p>
                </Cube>
                <Cube from="方塊:方塊:span" context={c} className="text-sm font-semibold">選單</Cube>
              </Cube>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">svg 星星</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="svgStarDrawer"
                color="warning"
                size="md"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6">
                  <p class="text-sm">svg 星星觸發的抽屜</p>
                </Cube>
                <Cube from="方塊:方塊:圖示" context={c}
                  size="md"
                  svg={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'}
                />
              </Cube>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">src 圖片</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="srcImageDrawer"
                color="base"
                size="lg"
                position="left"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6">
                  <p class="text-sm">圖片頭像觸發的抽屜</p>
                </Cube>
                <Cube from="方塊:方塊:圖片" context={c}
                  src="/media/v1/image/影像:影像:deno2"
                  objectFit="cover"
                  className="w-12 h-12 rounded-full"
                />
              </Cube>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">設定圖示</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="settingsIconDrawer"
                color="info"
                size="md"
                position="top"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6">
                  <p class="text-sm">設定圖示觸發的抽屜</p>
                </Cube>
                <Cube from="方塊:方塊:圖示" context={c} id="圖示:圖示:使用者" size="md" />
              </Cube>
            </div>
            <div class="flex flex-col items-center gap-2">
              <span class="text-xs text-slate-400">日曆圖示</span>
              <Cube from="方塊:方塊:抽屜按鈕" context={c}
                state="calendarIconDrawer"
                color="success"
                size="md"
                position="bottom"
              >
                <Cube from="方塊:方塊:div" context={c} className="p-6">
                  <p class="text-sm">日曆圖示觸發的抽屜</p>
                </Cube>
                <Cube from="方塊:方塊:圖示" context={c} id="圖示:圖示:日曆" size="md" />
              </Cube>
            </div>
          </div>
        </section>

        {/* 區塊十：使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:抽屜按鈕" — 基於按鈕建構，完整繼承色彩/尺寸/禁用支援</li>
              <li><strong>state</strong>: Alpine store key（{'$store.drawers.{state}'}），每個抽屜按鈕唯一</li>
              <li><strong>color</strong>: primary / secondary / accent / info / success / warning / error / base / neutral</li>
              <li><strong>size</strong>: xs / sm / md / lg / xl — 控制整體寬高與字級</li>
              <li><strong>disabled</strong>: true / false — 禁用時點擊不觸發抽屜</li>
              <li><strong>position</strong>: right / left / top / bottom — 抽屜滑出方向（預設 right）</li>
              <li><strong>JSX children</strong>: 抽屜內容以 JSX children 直接傳入 <code>{'<Cube>...</Cube>'}</code>；觸發器圖示也可作為 children 一併傳入，與抽屜內容並列</li>
              <li>預設無 children 時顯示使用者圖示；可傳入自訂 children 改變觸發器外觀，與抽屜內容共存</li>
              <li>多個抽屜按鈕只需設定不同 state 即可共存</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
