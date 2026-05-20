import Hero, { HeroProps, HeroTitle, HeroSubtitle, HeroContent, HeroActions } from '../components/Hero/index.tsx';
import Button from '../components/Button.tsx';

export default async function HeroTestPage() {
  const variants: HeroProps['variant'][] = [
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
  
  const colors: HeroProps['color'][] = [
    "primary",
    "secondary",
    "accent",
    "info",
    "success",
    "warning",
    "error"
  ];

  // 测试基本 Hero 组件
  const basicHero = (
    <Hero>
      <HeroTitle>歡迎來到我們的網站</HeroTitle>
      <HeroSubtitle>這是一個英雄區塊的示範</HeroSubtitle>
      <HeroContent>
        這是一個完整的英雄區塊組件，包含標題、副標題、內容和操作按鈕。
        支援背景圖像、全螢幕模式和響應式佈局。
      </HeroContent>
      <HeroActions>
        <Button variant="solid" color="primary">開始使用</Button>
        <Button variant="outline" color="neutral">了解更多</Button>
      </HeroActions>
    </Hero>
  );

  // 测试背景图像 Hero
  const imageHero = (
    <Hero 
      backgroundSrc="https://picsum.photos/1200/600" 
      minHeight="32rem"
      color="base"
    >
      <HeroTitle class="text-white">帶有背景圖像的英雄區塊</HeroTitle>
      <HeroSubtitle class="text-gray-200">背景圖像會自動添加遮罩層</HeroSubtitle>
      <HeroContent class="text-gray-300">
        背景圖像支援全螢幕顯示，內容會自動置中對齊。
        圖像上方有黑色遮罩層，確保文字可讀性。
      </HeroContent>
      <HeroActions>
        <Button variant="solid" color="primary">立即行動</Button>
        <Button variant="outline" color="neutral">觀看演示</Button>
      </HeroActions>
    </Hero>
  );

  // 测试全屏 Hero
  const fullScreenHero = (
    <Hero fullScreen color="accent">
      <HeroTitle>全螢幕英雄區塊</HeroTitle>
      <HeroSubtitle>佔據整個視窗高度</HeroSubtitle>
      <HeroContent>
        這個英雄區塊會佔據整個視窗高度，適合用於首頁的歡迎區域。
        支援響應式設計，在不同裝置上都能良好顯示。
      </HeroContent>
      <HeroActions>
        <Button variant="solid" color="primary" size="lg">開始探索</Button>
        <Button variant="outline" color="neutral" size="lg">查看功能</Button>
      </HeroActions>
    </Hero>
  );

  // 测试水平布局 Hero
  const horizontalHero = (
    <Hero direction="row" minHeight="20rem" color="info">
      <div class="flex-1">
        <HeroTitle>水平佈局英雄區塊</HeroTitle>
        <HeroSubtitle>內容和圖像並排顯示</HeroSubtitle>
        <HeroContent>
          在較大的螢幕上，內容和圖像會並排顯示，
          提供更好的視覺效果和使用體驗。
        </HeroContent>
        <HeroActions>
          <Button variant="solid" color="primary">立即體驗</Button>
        </HeroActions>
      </div>
      <div class="flex-1 flex items-center justify-center">
        <div class="w-48 h-48 bg-primary/20 rounded-full flex items-center justify-center">
          <span class="text-6xl">🎯</span>
        </div>
      </div>
    </Hero>
  );

  // 测试变体 Hero
  const variantHeros = variants.map((variant) => {
    const variantName = variant!.charAt(0).toUpperCase() + variant!.slice(1);
    const hero = (
      <Hero variant={variant!} color="primary" minHeight="16rem">
        <HeroTitle>{variantName} Hero</HeroTitle>
        <HeroSubtitle>測試 {variant} 變體</HeroSubtitle>
        <HeroContent>
          這是一個 {variant} 變體的英雄區塊組件示範。
        </HeroContent>
      </Hero>
    );
    return { variant, hero };
  });

  // 测试颜色 Hero
  const colorHeros = colors.map((color) => {
    const colorName = color!.charAt(0).toUpperCase() + color!.slice(1);
    const hero = (
      <Hero variant="solid" color={color!} minHeight="14rem">
        <HeroTitle>{colorName} Hero</HeroTitle>
        <HeroSubtitle>{color} 顏色主題</HeroSubtitle>
        <HeroContent>
          這是一個 {color} 顏色的英雄區塊組件示範。
        </HeroContent>
      </Hero>
    );
    return { color, hero };
  });

  return (
    <div class="space-y-8">
      <section>
        {basicHero}
      </section>

      <section class="container mx-auto p-6 space-y-8">
        <h1 class="text-3xl font-bold mb-2">Hero 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Hero 配置</p>

        <section>
          <h2 class="text-2xl font-semibold mb-4">背景圖像英雄區塊</h2>
          {imageHero}
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">全螢幕英雄區塊</h2>
          {fullScreenHero}
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">水平佈局英雄區塊</h2>
          {horizontalHero}
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">所有變體（Variants）</h2>
          <div class="space-y-4">
            {variantHeros.map(({ variant, hero }) => (
              <div>{hero}</div>
            ))}
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">顏色變化（Solid 變體）</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colorHeros.map(({ color, hero }) => (
              <div>{hero}</div>
            ))}
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">使用說明</h2>
          <div class="p-4 bg-base-200 rounded-lg">
            <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
              <li><strong>variant</strong>: 英雄區塊樣式變體</li>
              <li><strong>color</strong>: 顏色主題</li>
              <li><strong>direction</strong>: 佈局方向（column: 垂直, row: 水平）</li>
              <li><strong>fullScreen</strong>: 是否全螢幕顯示</li>
              <li><strong>minHeight</strong>: 最小高度（CSS值）</li>
              <li><strong>backgroundImage</strong>: 背景圖像資料庫 ID</li>
              <li><strong>backgroundSrc</strong>: 背景圖像 URL</li>
              <li><strong>backgroundSvg</strong>: 背景 SVG 內容</li>
              <li><strong>HeroTitle</strong>: 英雄區塊標題子組件</li>
              <li><strong>HeroSubtitle</strong>: 英雄區塊副標題子組件</li>
              <li><strong>HeroContent</strong>: 英雄區塊內容子組件</li>
              <li><strong>HeroActions</strong>: 英雄區塊操作按鈕子組件</li>
              <li>支援任意 Alpine.js x- 屬性</li>
            </ul>
          </div>
        </section>
      </section>
    </div>
  );
}