import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

// ── 內聯 SVG 字串（用於 svg 模式測試） ──
const inlineSvgs = {
  star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  heart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
};

const iconIds = ["圖示:圖示:使用者", "圖示:圖示:首頁", "圖示:圖示:web_cube"];
const imageIds = ["影像:影像:hono", "影像:影像:surrealDB", "影像:影像:deno2"];
const sizeVariants = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const colorVariants = [
  'primary', 'secondary', 'accent',
  'info', 'success', 'warning', 'error', 'neutral',
];

export default async function AvatarTestPage(c: Context) {
  return (
    <div class="container mx-auto p-6 space-y-8">
      <a href="/test" class="inline-block text-sm text-base-content/50 hover:text-base-content/80 mb-4">&larr; 返回測試頁</a>
      <section>
        <h1 class="text-3xl font-bold mb-2">頭像方塊測試</h1>
        <p class="text-base-content/70">使用 &lt;Cube from="方塊:方塊:頭像" size="lg" color="primary"&gt;...children...&lt;/Cube&gt;</p>
      </section>

      {/* ── 圖示模式（資料庫圖示） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">圖示模式（圖示 ID）</h2>
        <div class="flex flex-wrap gap-6">
          {iconIds.map(id => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <Cube from="方塊:方塊:頭像" context={c} size="lg" color="primary">
                <Cube from="方塊:方塊:圖示" context={c} id={id} size="lg" />
              </Cube>
              <span class="text-sm text-base-content/70 text-center">{id}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 圖片模式（資料庫圖片） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">圖片模式（圖片 ID）</h2>
        <div class="flex flex-wrap gap-6">
          {imageIds.map(id => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <Cube from="方塊:方塊:頭像" context={c} size="lg" color="neutral">
                <Cube from="方塊:方塊:圖片" context={c} id={id} width="100%" height="100%" objectFit="cover" />
              </Cube>
              <span class="text-sm text-base-content/70 text-center">{id}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── src 模式（直接圖片 URL） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">src 模式（直接圖片 URL）</h2>
        <div class="flex flex-wrap gap-6">
          {[
            { src: '/media/v1/image/影像:影像:hono', label: 'hono' },
            { src: '/media/v1/image/影像:影像:surrealDB', label: 'surrealDB' },
            { src: '/media/v1/image/影像:影像:deno2', label: 'deno2' },
          ].map(({ src, label }) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <Cube from="方塊:方塊:頭像" context={c} size="lg" color="neutral">
                <img src={src} alt={label} class="w-full h-full object-cover" />
              </Cube>
              <span class="text-sm text-base-content/70">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── svg 模式（內聯 SVG 字串） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">svg 模式（內聯 SVG 字串）</h2>
        <div class="flex flex-wrap gap-6">
          {Object.entries(inlineSvgs).map(([name, svgStr]) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <Cube from="方塊:方塊:頭像" context={c} size="lg" color="warning">
                <Cube from="方塊:方塊:圖示" context={c} svg={svgStr} size="md" />
              </Cube>
              <span class="text-sm text-base-content/70">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 後備模式（無 children，顯示預設人物圖示） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">後備模式（無 children，預設人物圖示）</h2>
        <div class="flex flex-wrap gap-6">
          {colorVariants.slice(0, 5).map(color => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <Cube from="方塊:方塊:頭像" context={c} size="lg" color={color} />
              <span class="text-sm text-base-content/70">{color}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 尺寸變化 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.map(size => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <Cube from="方塊:方塊:頭像" context={c} size={size} color="primary">
                <Cube from="方塊:方塊:圖示" context={c} id="圖示:圖示:使用者" size={size} />
              </Cube>
              <span class="text-sm font-medium">{size.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 顏色變化 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">顏色變化</h2>
        <div class="flex flex-wrap gap-6">
          {colorVariants.map(color => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <Cube from="方塊:方塊:頭像" context={c} size="lg" color={color}>
                <Cube from="方塊:方塊:圖示" context={c} id="圖示:圖示:使用者" size="md" />
              </Cube>
              <span class="text-sm text-base-content/70">{color}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 組合測試：圖示 + 多尺寸 + 多顏色 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">組合測試（圖示 + 尺寸 × 顏色）</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.slice(1, 5).flatMap(size =>
            colorVariants.slice(0, 3).map(color => (
              <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
                <Cube from="方塊:方塊:頭像" context={c} size={size} color={color}>
                  <Cube from="方塊:方塊:圖示" context={c} id="圖示:圖示:首頁" size={size} />
                </Cube>
                <span class="text-xs text-base-content/50">{size} / {color}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>圖示</strong>：&lt;Cube from="方塊:方塊:頭像" size="lg" color="primary"&gt;&lt;Cube from="方塊:方塊:圖示" id="圖示:圖示:使用者" /&gt;&lt;/Cube&gt;</li>
          <li><strong>圖片</strong>：&lt;Cube from="方塊:方塊:頭像" size="lg"&gt;&lt;Cube from="方塊:方塊:圖片" id="影像:影像:hono" /&gt;&lt;/Cube&gt;</li>
          <li><strong>src</strong>：&lt;Cube from="方塊:方塊:頭像" size="lg"&gt;&lt;img src="..." /&gt;&lt;/Cube&gt;</li>
          <li><strong>svg</strong>：&lt;Cube from="方塊:方塊:頭像" size="lg"&gt;&lt;Cube from="方塊:方塊:圖示" svg="&lt;svg&gt;..." /&gt;&lt;/Cube&gt;</li>
          <li><strong>後備</strong>：不傳 children，顯示空圓形容器</li>
          <li><strong>size</strong>：xs | sm | md | lg | xl | 2xl | 3xl</li>
          <li><strong>color</strong>：primary | secondary | accent | info | success | warning | error | base | neutral</li>
        </ul>
      </div>
    </div>
  );
}
