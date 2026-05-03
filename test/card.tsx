import Card, { CardProps, CardTitle, CardBody, CardFoot } from '../components/Card/index.tsx';
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

  // 测试变体卡片（使用子组件）
  const variantCards = variants.map((variant) => {
    const variantName = variant!.charAt(0).toUpperCase() + variant!.slice(1);
    const card = (
      <Card variant={variant!} color="primary">
        <CardTitle>{variantName} Card</CardTitle>
        <CardBody>這是一個卡片組件的示範內容。</CardBody>
        <CardFoot>
          <div class="flex gap-2">
            <Button variant="solid" color="success">確定</Button>
            <Button variant="solid" color="warning">取消</Button>
          </div>
        </CardFoot>
      </Card>
    );
    return { variant, card };
  });

  // 测试颜色卡片（使用子组件）
  const colorCards = colors.map((color) => {
    const colorName = color!.charAt(0).toUpperCase() + color!.slice(1);
    const card = (
      <Card variant="solid" color={color!}>
        <CardTitle>{colorName} Card</CardTitle>
        <CardBody>這是一個 {color} 顏色的卡片。</CardBody>
      </Card>
    );
    return { color, card };
  });

  // 测试图像卡片
  const imageCards = [
    // 垂直布局（图像在上方）
    <Card variant="solid" color="primary" direction="column" src="https://picsum.photos/400/200">
      <CardTitle>垂直布局卡片</CardTitle>
      <CardBody>图像在上方，内容在下方。</CardBody>
      <CardFoot>
        <Button variant="solid">了解更多</Button>
      </CardFoot>
    </Card>,
    // 水平布局（图像在左侧）
    <Card variant="outline" color="secondary" direction="row" src="https://picsum.photos/200/400">
      <CardTitle>水平布局卡片</CardTitle>
      <CardBody>
        图像在左侧，<br />
        图像在左侧，<br />
        图像在左侧，<br />
        内容在右侧。
      </CardBody>
      <CardFoot>
        <Button variant="solid">查看详情</Button>
      </CardFoot>
    </Card>,
    // 使用 SVG 图像
    <Card color="accent" image="影像:影像:hono">
      <CardTitle>ID 图像卡片</CardTitle>
      <CardBody>使用 ID 作为图像内容。</CardBody>
    </Card>
  ];

  const widthClasses = ["w-32", "w-48", "w-64", "w-80", "w-96", "w-full"];
  const widthLabels = ["w-32", "w-48", "w-64", "w-80", "w-96", "w-full"];
  const widthCards = widthClasses.map((widthClass, index) => {
    const card = (
      <Card variant="solid" color="primary" padding="md" className={widthClass}>
        <CardTitle>寬度: {widthLabels[index]}</CardTitle>
        <CardBody>測試不同寬度的卡片佈局。</CardBody>
      </Card>
    );
    return { width: widthLabels[index], card };
  });

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
        <h2 class="text-2xl font-semibold mb-4">圖像功能測試</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageCards.map((card, index) => (
            <div>{card}</div>
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
            <li><strong>direction</strong>: 佈局方向（column: 圖像在上方, row: 圖像在左側）</li>
            <li><strong>src</strong>: 圖像 URL</li>
            <li><strong>svg</strong>: SVG 內容</li>
            <li><strong>image</strong>: 圖像資料庫 ID</li>
            <li><strong>CardTitle</strong>: 卡片標題子組件</li>
            <li><strong>CardBody</strong>: 卡片內容子組件</li>
            <li><strong>CardFoot</strong>: 卡片頁腳子組件</li>
            <li>支援任意 Alpine.js x- 屬性</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
