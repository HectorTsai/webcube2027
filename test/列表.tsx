// test/列表.tsx — 列表方塊測試網頁
//
//   <Cube from="方塊:方塊:列表" context={c} color="primary" direction="column" divider>
//     <li>項目 A</li>
//     <li>項目 B</li>
//   </Cube>
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"] as const;

export default async function ListTestPage(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">列表（List）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:列表" context={c} color="primary" direction="column">'} — 支援垂直/水平排列、分隔線、斑馬紋、標題
          </p>
        </header>

        {/* 區塊一：基本垂直列表 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            基本垂直列表
          </h2>
          <Cube from="方塊:方塊:列表" context={c} color="base">
            <li class="px-4 py-3">第一項</li>
            <li class="px-4 py-3">第二項</li>
            <li class="px-4 py-3">第三項</li>
          </Cube>
        </section>

        {/* 區塊二：色彩主題 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block" />
            色彩主題（color prop）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.map(color => (
              <div class="space-y-1">
                <div class="text-xs text-slate-400 font-medium">{color}</div>
                <Cube from="方塊:方塊:列表" context={c} color={color}>
                  <li class="px-4 py-2 text-sm">項目 A</li>
                  <li class="px-4 py-2 text-sm">項目 B</li>
                  <li class="px-4 py-2 text-sm">項目 C</li>
                </Cube>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊三：分隔線 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
            分隔線（divider prop）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">無分隔線</div>
              <Cube from="方塊:方塊:列表" context={c} color="base">
                <li class="px-4 py-3">使用者設定</li>
                <li class="px-4 py-3">隱私權政策</li>
                <li class="px-4 py-3">服務條款</li>
                <li class="px-4 py-3">關於我們</li>
              </Cube>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">divider</div>
              <Cube from="方塊:方塊:列表" context={c} color="base" divider>
                <li class="px-4 py-3">使用者設定</li>
                <li class="px-4 py-3">隱私權政策</li>
                <li class="px-4 py-3">服務條款</li>
                <li class="px-4 py-3">關於我們</li>
              </Cube>
            </div>
          </div>
        </section>

        {/* 區塊四：斑馬紋 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-amber-500 rounded-full inline-block" />
            斑馬紋（stripe prop）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">無斑馬紋</div>
              <Cube from="方塊:方塊:列表" context={c} color="primary" divider>
                <li class="px-4 py-3">第 1 列</li>
                <li class="px-4 py-3">第 2 列</li>
                <li class="px-4 py-3">第 3 列</li>
                <li class="px-4 py-3">第 4 列</li>
                <li class="px-4 py-3">第 5 列</li>
                <li class="px-4 py-3">第 6 列</li>
              </Cube>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">stripe（偶數列半透明）</div>
              <Cube from="方塊:方塊:列表" context={c} color="primary" divider stripe>
                <li class="px-4 py-3">第 1 列</li>
                <li class="px-4 py-3">第 2 列</li>
                <li class="px-4 py-3">第 3 列</li>
                <li class="px-4 py-3">第 4 列</li>
                <li class="px-4 py-3">第 5 列</li>
                <li class="px-4 py-3">第 6 列</li>
              </Cube>
            </div>
          </div>
        </section>

        {/* 區塊五：標題 + divider + stripe 組合 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            標題 + 分隔線 + 斑馬紋
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Cube from="方塊:方塊:列表" context={c} color="info" divider stripe title="通知中心">
              <li class="px-4 py-3 flex justify-between items-center" onclick="alert('xxxx')">
                <span>系統更新</span>
                <span class="text-xs opacity-50">10 分鐘前</span>
              </li>
              <li class="px-4 py-3 flex justify-between items-center">
                <span>新訊息</span>
                <span class="text-xs opacity-50">1 小時前</span>
              </li>
              <li class="px-4 py-3 flex justify-between items-center">
                <span>付款確認</span>
                <span class="text-xs opacity-50">昨天</span>
              </li>
            </Cube>
            <Cube from="方塊:方塊:列表" context={c} color="success" divider stripe title="待辦清單">
              <li class="px-4 py-3 flex items-center gap-2">
                <span class="w-4 h-4 rounded border-2 border-current/30 flex-shrink-0" />
                <span>完成專案文件</span>
              </li>
              <li class="px-4 py-3 flex items-center gap-2">
                <span class="w-4 h-4 rounded border-2 border-current/30 flex-shrink-0" />
                <span>審查 PR</span>
              </li>
              <li class="px-4 py-3 flex items-center gap-2 opacity-50 line-through">
                <span class="w-4 h-4 rounded border-2 border-current/30 flex-shrink-0 bg-current/30" />
                <span>開早會</span>
              </li>
            </Cube>
          </div>
        </section>

        {/* 區塊六：水平排列 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            水平排列（direction="row"）
          </h2>
          <div class="space-y-3">
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">水平 + divider</div>
              <Cube from="方塊:方塊:列表" context={c} color="base" direction="row" divider>
                <li class="px-4 py-3 text-sm">首頁</li>
                <li class="px-4 py-3 text-sm">產品</li>
                <li class="px-4 py-3 text-sm">關於</li>
                <li class="px-4 py-3 text-sm">聯絡</li>
              </Cube>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">水平 + 無分隔線</div>
              <Cube from="方塊:方塊:列表" context={c} color="secondary" direction="row">
                <li class="px-4 py-3 text-sm">標籤 A</li>
                <li class="px-4 py-3 text-sm">標籤 B</li>
                <li class="px-4 py-3 text-sm">標籤 C</li>
                <li class="px-4 py-3 text-sm">標籤 D</li>
              </Cube>
            </div>
          </div>
        </section>

        {/* 區塊七：豐富內容列表 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-fuchsia-500 rounded-full inline-block" />
            豐富內容列表（icon + 文字 + 輔助資訊）
          </h2>
          <div class="grid grid-cols-1 gap-4">
            <Cube from="方塊:方塊:列表" context={c} color="primary" divider stripe title="團隊成員">
              <li class="px-4 py-3 flex items-center gap-3">
                <span class="w-8 h-8 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">A</span>
                <div class="flex-1">
                  <div class="font-medium">Alice 王</div>
                  <div class="text-xs opacity-50">前端工程師</div>
                </div>
                <span class="text-xs opacity-40">在線</span>
              </li>
              <li class="px-4 py-3 flex items-center gap-3">
                <span class="w-8 h-8 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">B</span>
                <div class="flex-1">
                  <div class="font-medium">Bob 陳</div>
                  <div class="text-xs opacity-50">後端工程師</div>
                </div>
                <span class="text-xs opacity-40">離線</span>
              </li>
              <li class="px-4 py-3 flex items-center gap-3">
                <span class="w-8 h-8 rounded-full bg-current/20 flex items-center justify-center text-sm font-bold">C</span>
                <div class="flex-1">
                  <div class="font-medium">Carol 林</div>
                  <div class="text-xs opacity-50">設計師</div>
                </div>
                <span class="text-xs opacity-40">忙碌</span>
              </li>
            </Cube>

            <Cube from="方塊:方塊:列表" context={c} color="accent" divider stripe title="最近活動">
              <li class="px-4 py-3 flex items-start gap-3">
                <span class="w-2 h-2 rounded-full bg-current mt-2 flex-shrink-0" />
                <div class="flex-1">
                  <div class="text-sm">推送到 main 分支</div>
                  <div class="text-xs opacity-50">feature/user-auth — 3 個 commit</div>
                </div>
                <span class="text-xs opacity-40 whitespace-nowrap">2 分鐘前</span>
              </li>
              <li class="px-4 py-3 flex items-start gap-3">
                <span class="w-2 h-2 rounded-full bg-current mt-2 flex-shrink-0" />
                <div class="flex-1">
                  <div class="text-sm">合併 PR #42</div>
                  <div class="text-xs opacity-50">fix: 修正登入頁面佈局</div>
                </div>
                <span class="text-xs opacity-40 whitespace-nowrap">15 分鐘前</span>
              </li>
              <li class="px-4 py-3 flex items-start gap-3">
                <span class="w-2 h-2 rounded-full bg-current mt-2 flex-shrink-0" />
                <div class="flex-1">
                  <div class="text-sm">部署 v2.3.1 到正式環境</div>
                  <div class="text-xs opacity-50">通過所有測試</div>
                </div>
                <span class="text-xs opacity-40 whitespace-nowrap">1 小時前</span>
              </li>
            </Cube>
          </div>
        </section>

        {/* 區塊八：role="separator" 分隔線 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-orange-500 rounded-full inline-block" />
            separator 分隔線（{'<li role="separator">'})
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">divider + separator（分隔線在 separator 處斷開）</div>
              <Cube from="方塊:方塊:列表" context={c} color="primary" divider>
                <li class="px-4 py-3">個人檔案</li>
                <li class="px-4 py-3">帳號安全</li>
                <li class="px-4 py-3">通知設定</li>
                <li role="separator"><hr class="border-current/15" /></li>
                <li class="px-4 py-3">關於我們</li>
                <li class="px-4 py-3">聯絡客服</li>
                <li class="px-4 py-3">版本資訊</li>
              </Cube>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-slate-400 font-medium">divider + stripe + separator</div>
              <Cube from="方塊:方塊:列表" context={c} color="success" divider stripe>
                <li class="px-4 py-3">水果</li>
                <li class="px-4 py-3">蔬菜</li>
                <li role="separator"><hr class="border-current/15" /></li>
                <li class="px-4 py-3">肉類</li>
                <li class="px-4 py-3">海鮮</li>
                <li class="px-4 py-3">乳製品</li>
              </Cube>
            </div>
          </div>
        </section>

        {/* 區塊九：使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:列表"</li>
              <li><strong>color</strong>: primary / secondary / accent / info / success / warning / error / base / neutral</li>
              <li><strong>direction</strong>: "column"（垂直，預設）/ "row"（水平）</li>
              <li><strong>divider</strong>: true / false — 項目之間顯示分隔線</li>
              <li><strong>stripe</strong>: true / false — 偶數列顯示半透明背景（斑馬紋）</li>
              <li><strong>title</strong>: 字串 — 可選標題（顯示在列表上方）</li>
              <li><strong>active</strong>: true / false — 供電狀態</li>
              <li><strong>hover</strong>: true / false — 懸停效果</li>
              <li>項目使用 <strong>&lt;li&gt;</strong> 傳入，可自由控制每個項目的樣式與內容</li>
              <li>在列表中插入 <strong>&lt;li role="separator"&gt;&lt;hr /&gt;&lt;/li&gt;</strong> 作為群組分隔線，divider 會自動在此處斷開</li>
              <li>水平模式搭配 divider 時分隔線會自動切換為直線（border-left）</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
