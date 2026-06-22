// test/主選單.tsx — 主選單方塊測試網頁
// Template/Slot 作用域規則請見 components/方塊.tsx 的「區域範疇圖紙解構引擎」註解區塊
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';
import Slot from '../components/Slot.tsx';
import Template from '../components/Template.tsx';

const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"] as const;

export default async function MenuBarTest(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 font-sans antialiased">

      {/* 固定在頁面頂部的主選單 demo */}
      <div class="sticky top-0 z-40 space-y-0">
        {/* 色彩主題展示 — 同 Template 展示結構，用 DrawerTitle / DrawerContext / Drawer 三層嵌套 */}
        <div>
          {colors.map(color => (
            <Cube from="方塊:方塊:主選單" context={c} color={color} drawerState={color}>
              <Template name="Links">
                <Cube from="方塊:方塊:超連結" href="/" size="sm" className="!border-none !shadow-none">首頁</Cube>
                <Cube from="方塊:方塊:超連結" href="/about" size="sm" className="!border-none !shadow-none">關於</Cube>
                <Cube from="方塊:方塊:超連結" href="/services" size="sm" className="!border-none !shadow-none">服務</Cube>
              </Template>
              <Template name="Brand">
                <Cube from="span" className="font-bold text-lg">{color}</Cube>
              </Template>
              <Template name="DrawerTitle">
                <Cube from="div" className="px-4 py-3">
                  <Slot template="Brand" />
                </Cube>
              </Template>
              <Template name="DrawerContext">
                <Cube from="方塊:方塊:列表" className="!border-none">
                  <Slot template="Links" />
                </Cube>
              </Template>
              <Template name="Drawer">
                <Slot name="header" template="DrawerTitle" />
                <Slot name="content" template="DrawerContext" />
              </Template>
              <Slot name="brand" template="Brand" />
              <Slot name="drawer" template="Drawer" />
              <Slot name="content" template="Links" />
            </Cube>
          ))}
        </div>

        {/* Template 展示 — brand 進 drawer header，連結用列表包裹 */}
        <div class="mt-4">
          <Cube from="方塊:方塊:主選單" context={c} color="secondary" drawerState="tplMenu">
            <Template name="NavLinks">
              <Cube from="方塊:方塊:超連結" href="/" size="sm" className="!border-none !shadow-none">首頁</Cube>
              <Cube from="方塊:方塊:超連結" href="/about" size="sm" className="!border-none !shadow-none">關於</Cube>
              <Cube from="方塊:方塊:超連結" href="/docs" size="sm" className="!border-none !shadow-none">文件</Cube>
            </Template>
            <Template name="Brand">
              <Cube from="方塊:方塊:圖示" />
              <Cube from="span" className="font-bold text-lg">Template Demo</Cube>
            </Template>
            <Template name="DrawerTitle">
                <Cube from="div" className="px-4 py-3">
                  <Slot template="Brand" />
                </Cube>
            </Template>
            <Template name="DrawerContext">
                <Cube from="方塊:方塊:列表" className="!border-none">
                  <Slot template="NavLinks" />
                </Cube>
            </Template>
            <Template name="Drawer">
              <Slot name="header" template="DrawerTitle" />
              <Slot name="content" template="DrawerContext" />
            </Template>
            <Slot name="brand" template="Brand" />
            <Slot name="drawer" template="Drawer" />
            <Slot name="content" template="NavLinks" />
          </Cube>
        </div>
      </div>

      <div class="max-w-4xl mx-auto p-6 sm:p-10 space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <Cube from="方塊:方塊:超連結" context={c} href="/test" size="xs" className="!border-none !shadow-none">&larr; 返回測試頁</Cube>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">主選單（MenuBar）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:主選單" context={c} color="primary">'} — 響應式導航列，桌面水平排列，行動版漢堡選單 + 抽屜
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
            <p>行動版（寬度 &lt; 768px）時：導航內容隱藏，改為漢堡選單按鈕。點擊按鈕後從左側滑入抽屜。</p>
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
              <li>桌面版（md+）：導航內容水平排列</li>
              <li>行動版（&lt;md）：自動切換為漢堡選單按鈕</li>
              <li><strong>搭配使用</strong>：無需手動放置抽屜，內建於 seed 的 <code>drawer</code> slot（shareChildren）</li>
              <li>兩者透過 Alpine.js <code>$store.drawers.menuDrawer</code> 連動</li>
              <li>可搭配 <strong>className="sticky top-0 z-50"</strong> 固定在頁面頂部</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
