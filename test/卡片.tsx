// test/卡片.tsx — 卡片方塊測試網頁
//
// 方塊定義由 Cube 自動從 DB 載入（透過 from + context），variant 自動合併。
// 使用方式：
//   <Cube from="方塊:方塊:卡片" direction="row" color="primary" context={c}>...</Cube>
import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

// ---------- 測試資料 ----------
const colors = ["primary", "secondary", "accent", "info", "success", "warning", "error"];

const sampleImages = [
  { id: "影像:影像:hono", label: "Hono" },
  { id: "影像:影像:surrealDB", label: "SurrealDB" },
  { id: "影像:影像:deno2", label: "Deno 2" },
];

export default async function CardTestPage(c: Context) {
  return (
    <div class="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans antialiased">
      <div class="max-w-7xl mx-auto space-y-12">

        {/* 頁首 */}
        <header class="border-b border-slate-200 pb-6">
          <a href="/test" class="inline-block text-sm text-slate-400 hover:text-slate-600 mb-2">&larr; 返回測試頁</a>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">
            卡片（Card）渲染測試
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            只需 &lt;Cube from="方塊:方塊:卡片" direction="row" context={"{c}"}&gt; — Cube 自動從 DB 載入定義，context 自動傳播
          </p>
        </header>

        {/* 區塊一：方向示範（column vs row） */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-indigo-500 rounded-full inline-block" />
            方向佈局示範
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 垂直卡片 — 圖片佔據整個上方 */}
            <div class="space-y-2">
              <div class="text-xs font-bold text-slate-400 tracking-wider">垂直卡片（column）— 圖片佔滿上方</div>
              <Cube from="方塊:方塊:卡片" context={c} color="primary" direction="column"
                slots={{
                  media: <Cube from="方塊:方塊:圖片" context={c} args={{ id: "影像:影像:hono", className: "w-full max-h-64 object-cover", alt: "Hono" }} />,
                }}
              >
                <Cube from="h3" context={c} className="text-lg font-bold mb-1">Hono 框架</Cube>
                <Cube from="p" context={c} className="text-sm text-base-content/70">輕量、高效能、支援多平台的 Web 框架</Cube>
              </Cube>
            </div>

            {/* 水平卡片 — 圖片佔據整個左方 */}
            <div class="space-y-2">
              <div class="text-xs font-bold text-slate-400 tracking-wider">水平卡片（row）— 圖片佔滿左側</div>
              <Cube from="方塊:方塊:卡片" context={c} color="primary" direction="row"
                slots={{
                  media: <Cube from="方塊:方塊:圖片" context={c} args={{ id: "影像:影像:surrealDB", className: "w-48 max-w-[40%] h-full object-cover flex-shrink-0", alt: "SurrealDB" }} />,
                }}
              >
                <Cube from="h3" context={c} className="text-lg font-bold mb-1">SurrealDB</Cube>
                <Cube from="p" context={c} className="text-sm text-base-content/70">新一代多模型資料庫，支援 SQL 與 GraphQL</Cube>
              </Cube>
            </div>

          </div>
        </section>

        {/* 區塊二：色彩變化 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
            色彩主題變化（垂直）
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {colors.map((color) => (
              <Cube from="方塊:方塊:卡片" context={c} color={color} direction="column"
                slots={{
                  media: <Cube from="方塊:方塊:圖片" context={c} args={{ id: "影像:影像:hono", className: "w-full max-h-32 object-cover", alt: color }} />,
                }}
              >
                <Cube from="p" context={c} className="text-sm font-bold capitalize text-center">{color}</Cube>
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊三：無圖片的純內容卡片（body slot 自動接收 JSX children） */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-amber-500 rounded-full inline-block" />
            純內容卡片（無圖片，body slot 自動接收 JSX children）
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {[
              { color: "primary", title: "專案開始", desc: "所有必要的準備工作已就緒，團隊蓄勢待發。", btn: "開始" },
              { color: "success", title: "部署成功", desc: "最新版本已成功部署至正式環境，全部測試通過。", btn: "查看" },
            ].map((item) => (
              <Cube from="方塊:方塊:卡片" context={c} color={item.color} direction="column">
                <Cube from="h3" context={c} className="text-lg font-bold mb-1">{item.title}</Cube>
                <Cube from="p" context={c} className="text-sm text-base-content/70 mb-3">{item.desc}</Cube>
                <Cube from="button" context={c} className="btn btn-sm mt-auto">{item.btn}</Cube>
              </Cube>
            ))}
          </div>
        </section>

        {/* 區塊四：供電狀態測試 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-rose-500 rounded-full inline-block" />
            供電狀態（active / inactive）
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {[{ active: true, label: "通電" }, { active: false, label: "斷電" }].map(({ active, label }) => (
              <div class="space-y-2">
                <div class="text-xs font-bold text-slate-400 tracking-wider">{label}</div>
                <Cube from="方塊:方塊:卡片" context={c} color="primary" direction="column" active={active}>
                  <Cube from="h3" context={c} className="text-lg font-bold mb-1">狀態卡片</Cube>
                  <Cube from="p" context={c} className="text-sm text-base-content/70">
                    {label === "通電" ? "此卡片供電正常，顯示完整色彩" : "此卡片已斷電，顯示 neutral 色"}
                  </Cube>
                </Cube>
              </div>
            ))}
          </div>
        </section>

        {/* 區塊五：資料庫圖片一覽 */}
        <section class="space-y-4">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <span class="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            資料庫圖片一覽
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {sampleImages.map((img) => (
              <Cube from="方塊:方塊:卡片" context={c} color="base" direction="column"
                slots={{
                  media: <Cube from="方塊:方塊:圖片" context={c} args={{ id: img.id, className: "w-full max-h-48 object-cover", alt: img.label }} />,
                }}
              >
                <Cube from="p" context={c} className="text-sm font-medium text-center">{img.label}</Cube>
              </Cube>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
