// test/drawer.tsx — 抽屜方塊測試網頁
//
// 方塊定義由 Cube 自動從 DB 載入（透過 from + context），variant 自動合併。
// 使用方式：
//   <Cube from="方塊:方塊:抽屜" position="right" state="myDrawer" context={c}>...</Cube>
import type { Context } from "hono";
import Cube from '../components/方塊.tsx';

export default async function DrawerTestPage(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        {/* 頁首 */}
        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            抽屜（Drawer）渲染測試
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            只需 &lt;Cube from="方塊:方塊:抽屜" position="right" context={"{c}"}&gt; — Cube 自動從 DB 載入定義，context 自動傳播
          </p>
        </header>

        {/* 區塊一：四方向測試 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block" />
            四方向滑入
          </h2>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="btn btn-primary"
              x-on:click="$store.drawers.leftDrawer = true"
            >&larr; 左側</button>
            <button
              type="button"
              class="btn btn-info"
              x-on:click="$store.drawers.rightDrawer = true"
            >右側 &rarr;</button>
            <button
              type="button"
              class="btn btn-success"
              x-on:click="$store.drawers.topDrawer = true"
            >&uarr; 頂部</button>
            <button
              type="button"
              class="btn btn-warning"
              x-on:click="$store.drawers.bottomDrawer = true"
            >&darr; 底部</button>
          </div>

          {/* 左側抽屜 */}
          <Cube from="方塊:方塊:抽屜" context={c} state="leftDrawer" position="left"
            slots={{
              header: <Cube from="div" context={c} className="p-4 text-lg font-bold border-b">左側 Drawer</Cube>,
              footer: <Cube from="div" context={c} className="p-4 border-t">
                <button type="button" class="btn btn-primary btn-sm" x-on:click="$store.drawers.leftDrawer = false">關閉</button>
              </Cube>,
            }}
          >
            <p class="px-4 py-4 text-sm opacity-80">這是從左側滑入的 Drawer。</p>
          </Cube>

          {/* 右側抽屜 */}
          <Cube from="方塊:方塊:抽屜" context={c} state="rightDrawer" position="right"
            slots={{
              header: <Cube from="div" context={c} className="p-4 text-lg font-bold border-b">右側 Drawer</Cube>,
              footer: <Cube from="div" context={c} className="p-4 border-t">
                <button type="button" class="btn btn-info btn-sm" x-on:click="$store.drawers.rightDrawer = false">關閉</button>
              </Cube>,
            }}
          >
            <p class="px-4 py-4 text-sm opacity-80">這是從右側滑入的 Drawer。</p>
          </Cube>

          {/* 頂部抽屜 */}
          <Cube from="方塊:方塊:抽屜" context={c} state="topDrawer" position="top"
            slots={{
              header: <Cube from="div" context={c} className="p-4 text-lg font-bold border-b">頂部 Drawer</Cube>,
              footer: <Cube from="div" context={c} className="p-4 border-t">
                <button type="button" class="btn btn-success btn-sm" x-on:click="$store.drawers.topDrawer = false">關閉</button>
              </Cube>,
            }}
          >
            <p class="px-4 py-4 text-sm opacity-80">這是從頂部滑入的 Drawer，適合通知列或搜尋欄。</p>
          </Cube>

          {/* 底部抽屜 */}
          <Cube from="方塊:方塊:抽屜" context={c} state="bottomDrawer" position="bottom"
            slots={{
              header: <Cube from="div" context={c} className="p-4 text-lg font-bold border-b">底部 Drawer</Cube>,
              footer: <Cube from="div" context={c} className="p-4 border-t">
                <button type="button" class="btn btn-warning btn-sm" x-on:click="$store.drawers.bottomDrawer = false">關閉</button>
              </Cube>,
            }}
          >
            <p class="px-4 py-4 text-sm opacity-80">這是從底部滑入的 Drawer，適合操作面板或篩選器。</p>
          </Cube>
        </section>

        {/* 區塊二：超長內容測試 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            超長內容（overflow-y-auto 測試）
          </h2>
          <button type="button" class="btn btn-error" x-on:click="$store.drawers.longContent = true">超長內容測試</button>

          <Cube from="方塊:方塊:抽屜" context={c} state="longContent" position="left"
            slots={{
              header: <Cube from="div" context={c} className="p-4 text-lg font-bold border-b">極限測試</Cube>,
              footer: <Cube from="div" context={c} className="p-4 border-t">
                <button type="button" class="btn btn-error btn-sm" x-on:click="$store.drawers.longContent = false">關閉</button>
              </Cube>,
            }}
          >
            <div class="space-y-3 p-4">
              <p class="text-sm opacity-80">這個 Drawer 包含超長內容，用來測試 overflow-y-auto 是否正常運作。</p>
              <p class="font-bold text-sm">第一章：開始</p>
              <p class="text-sm">在很久很久以前，有一個王國，王國裡住著各種各樣的人。他們每天忙碌地生活著，從早到晚不停地工作。</p>
              <p class="text-sm">村莊裡有一位年輕的鐵匠，名叫阿明。他每天天還沒亮就起床，點燃爐火，開始一天的鍛造工作。</p>
              <p class="font-bold text-sm">第二章：旅程</p>
              <p class="text-sm">有一天，阿明收到了一封來自遠方的信。信上說，王國的公主被一條巨龍困在了高山上。</p>
              <p class="text-sm">他走過了茂密的森林，翻過了陡峭的山嶺，渡過了寬闊的河流。</p>
              <p class="font-bold text-sm">第三章：挑戰</p>
              <p class="text-sm">阿明終於來到了巨龍的洞穴前。洞穴的入口散發著灼熱的氣息。</p>
              <p class="text-sm">巨龍盤踞在洞穴深處，它的身體像一座小山，眼睛像兩團燃燒的火焰。</p>
              <p class="font-bold text-sm">第四章：對決</p>
              <p class="text-sm">阿明集中全力，一劍刺向巨龍左胸沒有鱗片覆蓋的地方。</p>
              <p class="font-bold text-sm">第五章：歸來</p>
              <p class="text-sm">巨龍倒下了，公主得救了。從此以後，阿明成為了王國的英雄。</p>
              <p class="font-bold text-sm">第六章：後記</p>
              <p class="text-sm">如果你能看到這裡，代表我們的 Drawer 滾動功能運作正常！</p>
            </div>
          </Cube>
        </section>

        {/* 區塊三：使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:抽屜" — Cube 自動從 DB 載入定義，variant 自動合併</li>
              <li><strong>state</strong>: Alpine store 狀態名稱（{'$store.drawers.{state}'}），每個抽屜需有唯一 state</li>
              <li><strong>position</strong>: "left" | "right" | "top" | "bottom" — 透過 variant 自動調整樣式與動畫</li>
              <li><strong>slots.header</strong>: 頂部區域（shrink-0）</li>
              <li><strong>JSX children</strong>: 自動流入 content slot（flex-1 overflow-y-auto）</li>
              <li><strong>slots.footer</strong>: 底部區域（shrink-0）</li>
              <li>背景遮罩由 slots.backdrop 自動處理，點擊遮罩即關閉</li>
              <li>開啟：<code>x-on:click="$store.drawers.myDrawer = true"</code></li>
              <li>關閉：<code>x-on:click="$store.drawers.myDrawer = false"</code></li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
