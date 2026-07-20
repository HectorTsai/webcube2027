import type { Context } from 'hono';
import Cube from '../components/方塊.tsx';

const testIds = [
  "影像:影像:hono",
  "影像:影像:surrealDB",
  "影像:影像:deno2"
];

const sizeVariants = [
  { width: "50", height: "50", label: "50x50" },
  { width: "100", height: "100", label: "100x100" },
  { width: "200", height: "200", label: "200x200" },
  { width: "300", height: "300", label: "300x300" },
];

const objectFitOptions = ["fill", "contain", "cover", "none", "scale-down"] as const;

export default async function ImageTestPage(c: Context) {
  return (
    <div class="container mx-auto p-6 space-y-8">
      <a href="/test" class="inline-block text-sm text-base-content/50 hover:text-base-content/80 mb-4">&larr; 返回測試頁</a>
      <section>
        <h1 class="text-3xl font-bold mb-2">圖片方塊測試</h1>
        <p class="text-base-content/70">使用 &lt;Cube from="方塊:方塊:圖片" /&gt;</p>
      </section>

      {/* ── ID 來源（資料庫圖片） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">ID 來源（資料庫圖片）</h2>
        <div class="flex flex-wrap gap-6">
          {testIds.map(id => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖片" context={c} id={id} alt={`測試圖片 ${id}`} width="100" height="100" />
              </div>
              <span class="text-sm text-base-content/70 text-center">{id}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Src 來源（API 路徑） ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">Src 來源（API 路徑）</h2>
        <div class="flex flex-wrap gap-6">
          {testIds.map(id => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖片" context={c} src={`/media/v1/image/${id}`} alt={id.replace("影像:影像:", "")} width="100" height="100" />
              </div>
              <span class="text-sm text-base-content/70">{id.replace("影像:影像:", "")}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 不同尺寸 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">不同尺寸</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.map(({ width, height, label }) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{label}</h3>
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖片" context={c} id="影像:影像:hono" alt={`尺寸 ${width}x${height}`} width={width} height={height} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 只指定寬度 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">只指定寬度（高度自動調整）</h2>
        <div class="flex flex-wrap gap-6">
          {testIds.map(id => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖片" context={c} id={id} alt="寬度 100" width="100" />
              </div>
              <span class="text-sm text-base-content/70">{id}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 只指定高度 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">只指定高度（寬度自動調整）</h2>
        <div class="flex flex-wrap gap-6">
          {testIds.map(id => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖片" context={c} id={id} alt="高度 100" height="100" />
              </div>
              <span class="text-sm text-base-content/70">{id}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Loading 行為 ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">Loading 行為</h2>
        <div class="flex flex-wrap gap-6">
          {["lazy", "eager"].map(loading => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium capitalize">{loading}</h3>
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖片" context={c} id="影像:影像:hono" alt={`${loading} 1`} width="100" height="100" loading={loading} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Object-fit ── */}
      <section>
        <h2 class="text-2xl font-semibold mb-4">不同 Object-fit 選項</h2>
        <div class="flex flex-wrap gap-6">
          {objectFitOptions.map(fit => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{fit}</h3>
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                <Cube from="方塊:方塊:圖片" context={c} id="影像:影像:hono" alt={`Object-fit: ${fit}`} width="100" height="100" objectFit={fit} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>id</strong>：&lt;Cube from="方塊:方塊:圖片" id="影像:影像:hono" /&gt;</li>
          <li><strong>src</strong>：直接指定圖片路徑，&lt;Cube from="方塊:方塊:圖片" src="..." /&gt;</li>
          <li><strong>width/height/loading/objectFit</strong>：直接 prop</li>
        </ul>
      </div>
    </div>
  );
}
