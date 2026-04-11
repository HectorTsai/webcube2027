import Image, { ImageProps } from '../components/Image.tsx';

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

const objectFitOptions: Array<"fill" | "contain" | "cover" | "none" | "scale-down"> = ["fill", "contain", "cover", "none", "scale-down"];

export default async function ImageTestPage() {
  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Image 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Image 配置和使用方式</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">ID 來源（資料庫圖片）</h2>
        <div class="flex flex-wrap gap-6">
          {testIds.map((id) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                {Image({ id, alt: `測試圖片 ${id}`, width: "100", height: "100" })}
              </div>
              <span class="text-sm text-base-content/70 text-center">{id}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">Src 來源（API 路徑）</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ src: "/media/v1/image/影像:影像:hono", alt: "Hono", width: "100", height: "100" })}
            </div>
            <span class="text-sm text-base-content/70">Hono</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ src: "/media/v1/image/影像:影像:surrealDB", alt: "SurrealDB", width: "100", height: "100" })}
            </div>
            <span class="text-sm text-base-content/70">SurrealDB</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ src: "/media/v1/image/影像:影像:deno2", alt: "Deno2", width: "100", height: "100" })}
            </div>
            <span class="text-sm text-base-content/70">Deno2</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">不同尺寸</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.map(({ width, height, label }) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{label}</h3>
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                {Image({ id: "影像:影像:hono", alt: `尺寸 ${width}x${height}`, width, height })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">只指定寬度（高度自動調整）</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:hono", alt: "寬度 100", width: "100" })}
            </div>
            <span class="text-sm text-base-content/70">Hono</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:surrealDB", alt: "寬度 100", width: "100" })}
            </div>
            <span class="text-sm text-base-content/70">SurrealDB</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:deno2", alt: "寬度 100", width: "100" })}
            </div>
            <span class="text-sm text-base-content/70">Deno2</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">只指定高度（寬度自動調整）</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:hono", alt: "高度 100", height: "100" })}
            </div>
            <span class="text-sm text-base-content/70">Hono</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:surrealDB", alt: "高度 100", height: "100" })}
            </div>
            <span class="text-sm text-base-content/70">SurrealDB</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:deno2", alt: "高度 100", height: "100" })}
            </div>
            <span class="text-sm text-base-content/70">Deno2</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">Loading 行為</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <h3 class="text-sm font-medium">Lazy</h3>
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:hono", alt: "Lazy 1", width: "100", height: "100", loading: "lazy" })}
            </div>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <h3 class="text-sm font-medium">Eager</h3>
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:hono", alt: "Eager 1", width: "100", height: "100", loading: "eager" })}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">不同 Object-fit 選項</h2>
        <div class="flex flex-wrap gap-6">
          {objectFitOptions.map((fit) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{fit}</h3>
              <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
                {Image({ id: "影像:影像:hono", alt: `Object-fit: ${fit}`, width: "100", height: "100", objectFit: fit })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">Fallback 測試（不存在的 ID）</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
            <div class="flex justify-center items-center p-4 bg-base-200 rounded-lg">
              {Image({ id: "影像:影像:不存在的圖片", alt: "Fallback 測試", width: "100", height: "100", fallback: "/media/v1/image/影像:影像:hono" })}
            </div>
            <span class="text-sm text-base-content/70">Fallback 到 Hono</span>
          </div>
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>id</strong>: 從資料庫載入圖片</li>
          <li><strong>src</strong>: 使用圖片 URL</li>
          <li><strong>alt</strong>: 圖片說明文字（可存取性）</li>
          <li><strong>width/height</strong>: 圖片尺寸</li>
          <li><strong>loading</strong>: 載入行為（lazy/eager）</li>
          <li><strong>fallback</strong>: 載入失敗時的替代圖片</li>
          <li><strong>objectFit</strong>: 圖片縮放方式</li>
          <li><strong>className</strong>: 額外的 CSS 類名</li>
          <li>支援任意 Alpine.js x- 屬性</li>
        </ul>
      </div>
    </div>
  );
}
