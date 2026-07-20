// test/主選單.tsx — 主選單方塊測試網頁
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const testLinks = [
  { 路徑: "頁面:頁面:home", 標題: "首頁" },
  { 路徑: "/about", 標題: "關於我們" },
  { 路徑: "/services", 標題: "服務項目" },
];

const colors = [
  { name: "primary", label: "Primary" },
  { name: "secondary", label: "Secondary" },
  { name: "accent", label: "Accent" },
  { name: "info", label: "Info" },
  { name: "success", label: "Success" },
  { name: "warning", label: "Warning" },
  { name: "error", label: "Error" },
  { name: "base", label: "Base" },
  { name: "neutral", label: "Neutral" },
];

export default async function MenuBarTest(ctx: Context) {
  // 客製 Brand 插槽內容：圖示 + 品牌文字
  const brandSlot = [
    <Cube from="方塊:方塊:圖示" context={ctx} id="" size="lg" />,
    <Cube from="方塊:方塊:span" context={ctx} className="font-bold text-lg">Brand</Cube>,
  ];

  return (
    <div class="min-h-screen bg-slate-50/50 font-sans antialiased">

      {/* 固定在頁面頂部的主選單 demo */}
        <div class="sticky top-0 z-40 space-y-0">
        <Cube from="方塊:方塊:主選單" context={ctx} color="primary" drawerState="primary" items={testLinks}>
          {brandSlot}
        </Cube>
      </div>

      <div class="max-w-4xl mx-auto p-6 sm:p-10 space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <Cube from="方塊:方塊:超連結" context={ctx} href="/test" size="xs" className="!border-none !shadow-none">&larr; 返回測試頁</Cube>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">主選單（MenuBar）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:主選單" context={ctx} color="primary" items={links}>'} — 響應式導航列，桌面水平排列，行動版漢堡選單 + 抽屜
          </p>
        </header>

        {/* 九色展示區 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            九色主題展示
          </h2>
          <div class="space-y-2">
            {colors.map((color) => (
              <div class="overflow-hidden border border-slate-200">
                <div class="px-3 py-1.5 bg-slate-100 text-xs font-medium text-slate-500">
                  color="{color.name}" — {color.label}
                </div>
                <Cube
                  from="方塊:方塊:主選單"
                  context={ctx}
                  color={color.name}
                  drawerState={color.name}
                  items={testLinks}
                >
                  {brandSlot}
                </Cube>
              </div>
            ))}
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
              <li><strong>items</strong>: 物件陣列，含 路徑 與 標題 欄位，由 seed JSON 的 <code>repeat</code> 自動展開</li>
              <li>桌面版（md+）：brand | content 導航連結 | footer</li>
              <li>行動版（&lt;md）：brand | 漢堡選單按鈕，點擊後右側 Drawer 滑入</li>
              <li>每個顏色獨立 <code>drawerState</code>，避免多選單 Alpine store 衝突</li>
              <li>可搭配 <strong>className="sticky top-0 z-50"</strong> 固定在頁面頂部</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
