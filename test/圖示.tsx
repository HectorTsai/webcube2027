import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

// inline SVG — 只傳 path children，svg 外層由 圖示.tsx 負責
const svgPaths = {
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  heart: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />,
  check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
};

const testIds = ["圖示:圖示:web_cube", "圖示:圖示:使用者", "圖示:圖示:首頁", "圖示:圖示:電話", "圖示:圖示:資料庫", "圖示:圖示:鑰匙"];

const sizeVariants = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const colorVariants = [
  'text-primary', 'text-secondary', 'text-accent',
  'text-info', 'text-success', 'text-warning', 'text-error'
];

export default async function IconTestPage(c: Context) {
  return (
    <div class="container mx-auto p-6 space-y-8">
      <a href="/test" class="inline-block text-sm text-base-content/50 hover:text-base-content/80 mb-4">&larr; 返回測試頁</a>
      <section>
        <h1 class="text-3xl font-bold mb-2">圖示方塊測試</h1>
        <p class="text-base-content/70">使用 &lt;Cube from="方塊:方塊:圖示" /&gt;</p>
      </section>

      {/* ── 靜態 SVG ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">靜態 SVG 路徑測試</h2>
        <div class="flex flex-wrap gap-6">
          {Object.entries(svgPaths).map(([name, children]) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg">
              <div class="flex justify-center items-center min-h-16 p-4">
                <Cube from="方塊:方塊:圖示" size="md" fill="currentColor" stroke="none">
                  {children}
                </Cube>
              </div>
              <span class="text-sm text-base-content/70">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 資料庫圖示 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">ID 來源測試（資料庫圖示）</h2>
        <div class="flex flex-wrap gap-6">
          {testIds.map(id => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <div class="flex justify-center items-center min-h-16 p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖示" context={c} id={id} size="md" />
              </div>
              <span class="text-sm text-base-content/70 text-center">{id}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 顏色變化（靜態） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">顏色變化測試（靜態）</h2>
        <div class="flex flex-wrap gap-6">
          {colorVariants.map(colorClass => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{colorClass}</h3>
              <div class="flex justify-center items-center min-h-16 p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖示" size="md" fill="currentColor" stroke="none" className={colorClass}>
                  {svgPaths.star}
                </Cube>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 顏色變化（資料庫） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">ID 來源顏色測試（資料庫圖示）</h2>
        <div class="flex flex-wrap gap-6">
          {colorVariants.map(colorClass => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{colorClass}</h3>
              <div class="flex justify-center items-center min-h-16 p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖示" context={c} id="圖示:圖示:使用者" size="md" className={colorClass} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 尺寸變化（靜態） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試（靜態）</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.map(variant => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{variant.toUpperCase()}</h3>
              <div class="flex justify-center items-center min-h-20 p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖示" size={variant} fill="currentColor" stroke="none">
                  {svgPaths.star}
                </Cube>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 尺寸變化（資料庫國旗） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試（資料庫國旗）</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.map(variant => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{variant.toUpperCase()}</h3>
              <div class="flex justify-center items-center min-h-20 p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖示" context={c} id="圖示:圖示:中華民國" size={variant} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>靜態模式</strong>：SVG path 作為 children，&lt;Cube from="方塊:方塊:圖示" size="md"&gt;...&lt;/Cube&gt;</li>
          <li><strong>資料庫模式</strong>：&lt;Cube from="方塊:方塊:圖示" id="圖示:圖示:xxx" size="md" /&gt;</li>
          <li><strong>className</strong>：直接 prop，如 className="text-primary"</li>
        </ul>
      </div>
    </div>
  );
}
