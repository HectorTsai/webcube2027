import Icon, { IconProps } from '../components/Icon.tsx';

const svgSet = {
  star: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  heart: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  check: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
};

const testIds = ["圖示:圖示:user", "圖示:圖示:home", "圖示:圖示:phone", "圖示:圖示:中華民國"];

export default function IconTestPage() {
  const sizeVariants: IconProps['size'][] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
  const colorVariants = [
    'text-primary',
    'text-secondary',
    'text-accent',
    'text-info',
    'text-success',
    'text-warning',
    'text-error'
  ];

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Icon 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Icon 配置和使用方式</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">SVG 來源測試</h2>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg">
            <div class="flex justify-center items-center min-h-16 p-4">
              {Icon({ svg: svgSet.star, size: 'md' })}
            </div>
            <span class="text-sm text-base-content/70">星星</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg">
            <div class="flex justify-center items-center min-h-16 p-4">
              {Icon({ svg: svgSet.heart, size: 'md' })}
            </div>
            <span class="text-sm text-base-content/70">愛心</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg">
            <div class="flex justify-center items-center min-h-16 p-4">
              {Icon({ svg: svgSet.check, size: 'md' })}
            </div>
            <span class="text-sm text-base-content/70">勾勾</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg">
            <div class="flex justify-center items-center min-h-16 p-4">
              {Icon({ svg: svgSet.sun, size: 'md' })}
            </div>
            <span class="text-sm text-base-content/70">太陽</span>
          </div>
          <div class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg">
            <div class="flex justify-center items-center min-h-16 p-4">
              {Icon({ svg: svgSet.moon, size: 'md' })}
            </div>
            <span class="text-sm text-base-content/70">月亮</span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">ID 來源測試（數據庫圖示）</h2>
        <div class="flex flex-wrap gap-6">
          {testIds.map((id) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <div class="flex justify-center items-center min-h-16 p-4 bg-base-200 rounded-lg">
                {Icon({ id, size: 'md' })}
              </div>
              <span class="text-sm text-base-content/70 text-center">{id}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">顏色變化測試</h2>
        <div class="flex flex-wrap gap-6">
          {colorVariants.map((colorClass) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{colorClass}</h3>
              <div class="flex justify-center items-center min-h-16 p-4 bg-base-200 rounded-lg">
                {Icon({ svg: svgSet.star, size: 'md', className: colorClass })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">ID 來源顏色測試（數據庫圖示）</h2>
        <p class="text-base-content/70 mb-4">⚠️ 注意：測試頁面沒有 context，使用 id 時會回退到 img 方式，顏色可能不會改變！</p>
        <div class="flex flex-wrap gap-6">
          {colorVariants.map((colorClass) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{colorClass}</h3>
              <div class="flex justify-center items-center min-h-16 p-4 bg-base-200 rounded-lg">
                {Icon({ id: "圖示:圖示:user", size: 'md', className: colorClass })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.map((variant) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{variant.toUpperCase()}</h3>
              <div class="flex justify-center items-center min-h-20 p-4 bg-base-200 rounded-lg">
                {Icon({ svg: svgSet.star, size: variant })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試（國旗）</h2>
        <div class="flex flex-wrap gap-6 items-end">
          {sizeVariants.map((variant) => (
            <div class="flex flex-col items-center gap-2 p-4 bg-base-100 shadow-md rounded-lg">
              <h3 class="text-sm font-medium">{variant.toUpperCase()}</h3>
              <div class="flex justify-center items-center min-h-20 p-4 bg-base-200 rounded-lg">
                {Icon({ id: "圖示:圖示:中華民國", size: variant })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>svg</strong>: 直接使用 SVG 字串作為圖示</li>
          <li><strong>id</strong>: 從資料庫載入圖示</li>
          <li><strong>src</strong>: 使用圖片 URL</li>
          <li><strong>size</strong>: 圖示尺寸（xs, sm, md, lg, xl, 2xl, 3xl）</li>
          <li><strong>className</strong>: 額外的 CSS 類名（可用於設定顏色，如 text-primary、text-secondary 等）</li>
          <li>支援任意 Alpine.js x- 屬性</li>
        </ul>
      </div>
    </div>
  );
}
