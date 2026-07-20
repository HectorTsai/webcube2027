// test/頁尾.tsx — 頁尾方塊測試網頁
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error", "base", "neutral"] as const;

export default async function FooterTest(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-4xl mx-auto space-y-12">

        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">頁尾（Footer）渲染測試</h1>
          <p class="text-sm text-slate-500 mt-1">
            {'<Cube from="方塊:方塊:頁尾" context={c} color="primary">'} — 支援色彩主題、變體、內距等
          </p>
        </header>

        {/* 區塊一：基本頁尾 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-purple-500 rounded-full inline-block" />
            基本頁尾
          </h2>
          <Cube from="方塊:方塊:頁尾" context={c} color="primary">
            <div class="text-center text-sm">
              <p>&copy; 2024 WebCube. All rights reserved.</p>
            </div>
          </Cube>
        </section>

        {/* 區塊二：色彩主題 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block" />
            色彩主題（color prop）
          </h2>
          <div class="space-y-3">
            {colors.map(color => (
              <Cube from="方塊:方塊:頁尾" context={c} color={color}>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">{color} Footer</span>
                  <span class="text-xs opacity-60">&copy; 2024</span>
                </div>
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊三：豐富頁尾 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
            多欄頁尾
          </h2>
          <Cube from="方塊:方塊:頁尾" context={c} color="neutral">
            <div class="flex flex-wrap gap-8 justify-between">
              <div>
                <h3 class="font-bold mb-2">WebCube</h3>
                <p class="text-xs opacity-60">雲端網站建置平台</p>
              </div>
              <div>
                <h4 class="font-medium text-sm mb-1">產品</h4>
                <ul class="text-xs opacity-60 space-y-1">
                  <li>方塊系統</li>
                  <li>AI 生成</li>
                  <li>多語言</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-sm mb-1">聯絡</h4>
                <ul class="text-xs opacity-60 space-y-1">
                  <li>支援中心</li>
                  <li>文件</li>
                  <li>社群</li>
                </ul>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-current/10 text-center text-xs opacity-50">
              &copy; 2024 WebCube 2027. All rights reserved.
            </div>
          </Cube>
        </section>

        {/* 區塊四：版權資訊 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            版權資訊（copyright prop）
          </h2>
          <Cube from="方塊:方塊:頁尾" context={c} color="primary"
            copyright={{ 公司: "WebCube", 網址: "https://webcube.tw", 開始年份: "2024" }}
          />
        </section>

        {/* 區塊五：使用說明 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            使用說明
          </h2>
          <div class="p-4 bg-slate-100 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>from</strong>: "方塊:方塊:頁尾"</li>
              <li><strong>color</strong>: primary / secondary / accent / info / success / warning / error / base / neutral</li>
              <li>內容透過 <strong>children</strong> 傳入，可自由設計頁尾結構</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
