import Card, { CardProps } from '../components/Card/index.tsx';
import Button from '../components/Button/index.tsx';

export default async function CardTestPage() {
  const variants: CardProps['variant'][] = [
    "solid",
    "outline",
    "ghost",
    "dot",
    "dashed",
    "double",
    "glow",
    "minimalist",
    "crystal",
    "diagonal-stripes",
    "gradient-right",
    "gradient-left",
    "gradient-up",
    "gradient-down",
    "gradient-middle",
    "gradient-diagonal",
    "gradient-center",
    "gradient-cone"
  ];
  
  const colors: CardProps['color'][] = [
    "primary",
    "secondary",
    "accent",
    "info",
    "success",
    "warning",
    "error"
  ];

  const variantCards = await Promise.all(variants.map(async (variant) => {
    const card = await Card({
      variant,
      color: "primary",
      padding: "lg",
      children: (
        <div class="space-y-4">
          <div class="text-lg font-bold">{variant.charAt(0).toUpperCase() + variant.slice(1)} Card</div>
          <p class="text-sm opacity-80">這是一個卡片組件的示範內容。</p>
          <div class="flex gap-2">
            {Button({ variant: "solid", color: "success", children: "確定" })}
            {Button({ variant: "solid", color: "warning", children: "取消" })}
          </div>
        </div>
      )
    });
    return { variant, card };
  }));

  const colorCards = await Promise.all(colors.map(async (color) => {
    const card = await Card({
      variant: "solid",
      color,
      padding: "lg",
      children: (
        <div class="space-y-4">
          <div class="text-lg font-bold">{color.charAt(0).toUpperCase() + color.slice(1)} Card</div>
          <p class="text-sm opacity-80">這是一個 {color} 顏色的卡片。</p>
        </div>
      )
    });
    return { color, card };
  }));

  const widths: CardProps['width'][] = ["xs", "sm", "md", "lg", "xl", "full"];
  const widthCards = await Promise.all(widths.map(async (width) => {
    const card = await Card({
      variant: "solid",
      color: "primary",
      width,
      padding: "md",
      children: <div>寬度: {width}</div>
    });
    return { width, card };
  }));

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Card 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Card 配置</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">所有變體（Variants）</h2>
        <div class="flex flex-wrap gap-4">
          {variantCards.map(({ variant, card }) => (
            <div class="w-full md:w-80">{card}</div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">顏色變化（Solid 變體）</h2>
        <div class="flex flex-wrap gap-4">
          {colorCards.map(({ color, card }) => (
            <div class="w-full md:w-80">{card}</div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">不同寬度測試</h2>
        <div class="space-y-4">
          {widthCards.map(({ width, card }) => (
            <div>{card}</div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">使用說明</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
            <li><strong>variant</strong>: 卡片樣式變體</li>
            <li><strong>color</strong>: 顏色主題</li>
            <li><strong>width</strong>: 寬度設定</li>
            <li><strong>padding</strong>: 內距大小</li>
            <li><strong>direction</strong>: 佈局方向（row, column）</li>
            <li>支援任意 Alpine.js x- 屬性</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
