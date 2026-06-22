// test/基礎佈局.tsx — 基礎佈局方塊測試網頁
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

export default async function BasicLayoutTest(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">基礎佈局（Basic Layout）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:基礎佈局" context={c}>'} — 全頁面三段式佈局
          </p>
        </header>

        {/* 區塊一：三段式滿版佈局 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            基本滿版佈局
          </h2>
          <div class="rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-base-70">
            <Cube from="方塊:方塊:基礎佈局" context={c}
              slots={{
                content: <Cube from="div" className="bg-neutral-50 text-slate-600 p-lg flex flex-col">
                  <p class="text-lg font-medium">中間內容區（Content）</p>
                  <p class="text-sm mt-2">自動充滿剩餘空間</p>
                </Cube>,
              }}
            />
          </div>
        </section>

        {/* 區塊二：使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:基礎佈局"</li>
              <li>三段式佈局：頂部主選單（header）、中間內容區（content，flex-1 充滿）、底部頁尾（footer）</li>
              <li>header（主選單）和 footer（頁尾）固定在 JSON 中</li>
              <li>只需傳入 content slot</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
