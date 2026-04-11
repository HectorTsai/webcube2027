import Button, { ButtonProps } from '../components/Button/index.tsx';

export default async function ButtonTestPage() {
  const variants: ButtonProps['variant'][] = [
    'solid',
    'outline',
    'ghost',
    'dot',
    'dashed',
    'double',
    'gradient-right',
    'gradient-left',
    'gradient-up',
    'gradient-down',
    'gradient-middle',
    'gradient-diagonal',
    'gradient-center',
    'gradient-cone',
    'crystal',
    'diagonal-stripes',
    'glow',
    'minimalist'
  ];
  
  const colors: ButtonProps['color'][] = [
    'primary',
    'secondary',
    'accent',
    'info',
    'success',
    'warning',
    'error',
  ];
  
  const sizes: ButtonProps['size'][] = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl'
  ];

  const variantButtons = await Promise.all(variants.map(async (variant) => {
    const colorButtons = await Promise.all(colors.map(async (color) => {
      const button = await Button({
        variant,
        color,
        children: `${color.charAt(0).toUpperCase() + color.slice(1)}`
      });
      return { color, button };
    }));
    return { variant, colorButtons };
  }));

  const sizeButtons = await Promise.all(sizes.map(async (size) => {
    const button = await Button({
      variant: 'solid',
      color: 'primary',
      size,
      children: size.toUpperCase()
    });
    return { size, button };
  }));

  const normalButton = await Button({
    variant: 'solid',
    color: 'primary',
    children: '正常按鈕'
  });

  const disabledButton = await Button({
    variant: 'solid',
    color: 'primary',
    disabled: true,
    children: '禁用按鈕'
  });

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Button 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Button 配置，點擊查看效果</p>
      </section>

      {variantButtons.map(({ variant, colorButtons }) => (
        <section>
          <h2 class="text-2xl font-semibold mb-4">{variant.charAt(0).toUpperCase() + variant.slice(1)} 按鈕</h2>
          <div class="flex flex-wrap gap-4">
            {colorButtons.map(({ color, button }) => (
              <div class="flex flex-col items-center gap-2">
                <div class="p-4 bg-base-200 rounded-lg">{button}</div>
                <span class="text-sm text-base-content/70">{color}</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 class="text-2xl font-semibold mb-4">尺寸變化測試</h2>
        <div class="flex flex-wrap gap-4">
          {sizeButtons.map(({ size, button }) => (
            <div class="flex flex-col items-center gap-2">
              <div class="p-4 bg-base-200 rounded-lg">{button}</div>
              <span class="text-sm text-base-content/70">{size}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">狀態測試</h2>
        <div class="flex flex-wrap gap-4">
          <div class="flex flex-col items-center gap-2">
            <div class="p-4 bg-base-200 rounded-lg">{normalButton}</div>
            <span class="text-sm text-base-content/70">正常狀態</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <div class="p-4 bg-base-200 rounded-lg">{disabledButton}</div>
            <span class="text-sm text-base-content/70">禁用狀態</span>
          </div>
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>variant</strong>: 按鈕樣式變體（solid、outline、ghost 等）</li>
          <li><strong>color</strong>: 按鈕顏色主題</li>
          <li><strong>size</strong>: 按鈕尺寸</li>
          <li><strong>disabled</strong>: 禁用狀態</li>
          <li><strong>children</strong>: 按鈕文字內容</li>
          <li><strong>onClick</strong>: Alpine.js 點擊事件處理</li>
          <li><strong>className</strong>: 額外的 CSS 類名</li>
          <li>圓角使用 <code>rounded-sm</code></li>
        </ul>
      </div>
    </div>
  );
}
