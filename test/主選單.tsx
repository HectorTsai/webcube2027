// test/主選單.tsx — 主選單方塊測試網頁
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"] as const;
const testLinks = ["頁面:頁面:home", "關於", "服務"];

export default async function MenuBarTest(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 font-sans antialiased">

      {/* 固定在頁面頂部的主選單 demo */}
      <div class="sticky top-0 z-40 space-y-0">
        {/* 色彩主題展示 — 傳入 items 由 repeat 展開 */}
        <div>
          {colors.map(color => (
            <Cube from="方塊:方塊:主選單" context={c} color={color} drawerState={color} items={testLinks} />
          ))}
        </div>
      </div>

      <div class="max-w-4xl mx-auto p-6 sm:p-10 space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <Cube from="方塊:方塊:超連結" context={c} href="/test" size="xs" className="!border-none !shadow-none">&larr; 返回測試頁</Cube>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">主選單（MenuBar）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:主選單" context={c} color="primary" items={links}>'} — 響應式導航列，桌面水平排列，行動版漢堡選單 + 抽屜
          </p>
        </header>

        {/* 內容佔位區 — 展示下拉空間 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            頁面內容區域（向下捲以測試 sticky 效果）
          </h2>
          <div class="p-8 bg-white rounded-lg border border-slate-200 space-y-4 text-sm text-slate-500">
            <p>主選單位於頁面頂部，使用 <code class="bg-slate-100 px-1 rounded">sticky top-0</code> 固定在畫面上方。</p>
            <p>行動版（寬度 &lt; 768px）時：導航內容隱藏，改為漢堡選單按鈕。點擊按鈕後從右側滑入抽屜。</p>
            <p>品牌（brand）預設使用 mergedArgs 從 API 取得 logo + 名稱，抽屜無 header 內容。</p>
            <div class="h-64 bg-slate-50 rounded flex items-center justify-center text-slate-300">捲動空間</div>
            <div class="h-64 bg-slate-50 rounded flex items-center justify-center text-slate-300">更多捲動空間</div>
          </div>
        </section>

        {/* 使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:主選單"</li>
              <li><strong>color</strong>: primary / secondary / accent / info / success / warning / error / base / neutral</li>
              <li><strong>items</strong>: 字串陣列，傳入後由 seed JSON 的 <code>repeat</code> 自動展開</li>
              <li>桌面版（md+）：brand | content 導航連結 | footer</li>
              <li>行動版（&lt;md）：brand | 漢堡選單按鈕，點擊後右側 Drawer 滑入</li>
              <li>品牌（brand）預設使用 <code>mergedArgs</code> 從 API 取得 logo + 名稱</li>
              <li>抽屜內連結點擊後自動關閉</li>
              <li>可搭配 <strong>className="sticky top-0 z-50"</strong> 固定在頁面頂部</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
