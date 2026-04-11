import Avatar, { AvatarProps } from '../components/Avatar/index.tsx';

export default async function AvatarTestPage() {
  const testSvgs = {
    user: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>',
    star: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    heart: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    check: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  };

  const variants: AvatarProps['variant'][] = [
    'solid',
    'outline',
    'ghost',
    'dot',
    'dashed',
    'double',
    'glow',
    'crystal',
    'diagonal-stripes',
    'gradient-right',
    'gradient-left',
    'gradient-up',
    'gradient-down',
    'gradient-middle',
    'gradient-diagonal',
    'gradient-center',
    'gradient-cone',
    'minimalist'
  ];
  
  const colors: AvatarProps['color'][] = [
    'primary',
    'secondary',
    'accent',
    'info',
    'success',
    'warning',
    'error',
  ];
  
  const sizes: AvatarProps['size'][] = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl'
  ];

  // 渲染所有 variant
  const variantAvatars = await Promise.all(variants.map(async (variant) => {
    const avatars = await Promise.all(colors.map((color) => {
      return Avatar({ variant, color, svg: testSvgs.user });
    }));
    return { variant, avatars };
  }));

  // 渲染 SVG 來源測試
  const svgAvatars = await Promise.all([
    Avatar({ svg: testSvgs.star, size: "md", variant: "solid", color: "primary" }),
    Avatar({ svg: testSvgs.heart, size: "md", variant: "solid", color: "secondary" }),
    Avatar({ svg: testSvgs.check, size: "md", variant: "solid", color: "accent" }),
  ]);

  // 渲染 Image 來源測試
  const imageAvatars = await Promise.all([
    Avatar({ image: "影像:影像:hono", size: "md", variant: "solid", color: "primary" }),
    Avatar({ image: "影像:影像:surrealDB", size: "md", variant: "solid", color: "secondary" }),
    Avatar({ image: "影像:影像:deno2", size: "md", variant: "solid", color: "accent" }),
  ]);

  // 渲染不同尺寸測試
  const sizeAvatars = await Promise.all(sizes.map(size => 
    Avatar({ svg: testSvgs.user, variant: "solid", size, color: "primary" })
  ));

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Avatar 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Avatar 配置</p>
      </section>

      {variantAvatars.map(({ variant, avatars }) => (
        <section>
          <h2 class="text-2xl font-semibold mb-4">{variant.charAt(0).toUpperCase() + variant.slice(1)} Avatar</h2>
          <div class="flex flex-wrap gap-4">
            {avatars.map((avatar, i) => (
              <div class="flex flex-col items-center gap-2">
                <div class="p-4 bg-base-200 rounded-lg">
                  {avatar}
                </div>
                <span class="text-sm">{colors[i]}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 class="text-2xl font-semibold mb-4">SVG 來源</h2>
        <div class="flex flex-wrap gap-4">
          {svgAvatars.map((avatar, i) => (
            <div class="flex flex-col items-center gap-2">
              <div class="p-4 bg-base-200 rounded-lg">
                {avatar}
              </div>
              <span class="text-sm text-base-content/70">{['star', 'heart', 'check'][i]}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">Image 來源</h2>
        <div class="flex flex-wrap gap-4">
          {imageAvatars.map((avatar, i) => (
            <div class="flex flex-col items-center gap-2">
              <div class="p-4 bg-base-200 rounded-lg">
                {avatar}
              </div>
              <span class="text-sm text-base-content/70">{['hono', 'surrealDB', 'deno2'][i]}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試</h2>
        <div class="flex flex-wrap gap-4 items-end">
          {sizeAvatars.map((avatar, i) => (
            <div class="flex flex-col items-center gap-2">
              <div class="p-4 bg-base-200 rounded-lg">
                {avatar}
              </div>
              <span class="text-sm text-base-content/70">{sizes[i]}</span>
            </div>
          ))}
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>variant</strong>: Avatar 樣式變體（solid、outline、ghost 等）</li>
          <li><strong>color</strong>: Avatar 顏色主題</li>
          <li><strong>size</strong>: Avatar 尺寸</li>
          <li><strong>src</strong>: 直接圖片來源 URL</li>
          <li><strong>icon</strong>: 圖示 ID 從資料庫（如 "圖示:圖示:user"）</li>
          <li><strong>image</strong>: 圖片 ID 從資料庫（如 "影像:影像:hono"）</li>
          <li><strong>svg</strong>: SVG 字串內容</li>
          <li><strong>className</strong>: 額外的 CSS 類名</li>
          <li>支援任意屬性（包括 Alpine.js x- 屬性和事件處理器）</li>
        </ul>
      </div>
    </div>
  );
}
