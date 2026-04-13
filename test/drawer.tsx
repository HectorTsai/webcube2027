import Drawer, { DrawerTitle, DrawerFooter, DrawerProps } from '../components/Drawer/index.tsx';
import Button from '../components/Button/index.tsx';

export default async function DrawerTestPage() {
  const variants: DrawerProps['variant'][] = [
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

  const colors: DrawerProps['color'][] = [
    "primary",
    "secondary",
    "accent",
    "info",
    "success",
    "warning",
    "error"
  ];

  const leftVariantItems = await Promise.all(variants.slice(0, 6).map(async (v, index) => {
    const drawer = await Drawer({
      state: `leftDrawer${index}`,
      position: "left",
      variant: v,
      color: "primary",
      children: (
        <>
          <DrawerTitle>{v!.charAt(0).toUpperCase() + v!.slice(1)} Drawer</DrawerTitle>
          <p class="text-sm opacity-80 w-full">這是左側 {v} 樣式的 Drawer。</p>
          <DrawerFooter>
            <Button variant="solid" color="success" x-on:click={`$store.drawers.leftDrawer${index} = false`}>確定</Button>
            <Button variant="outline" color="warning" x-on:click={`$store.drawers.leftDrawer${index} = false`}>取消</Button>
          </DrawerFooter>
        </>
      )
    });
    return { variant: v, drawer, index };
  }));

  const rightVariantItems = await Promise.all(variants.slice(0, 6).map(async (v, index) => {
    const drawer = await Drawer({
      state: `rightDrawer${index}`,
      position: "right",
      variant: v,
      color: "secondary",
      children: (
        <>
          <DrawerTitle>{v!.charAt(0).toUpperCase() + v!.slice(1)} Drawer</DrawerTitle>
          <p class="text-sm opacity-80 w-full">這是右側 {v} 樣式的 Drawer。</p>
          <DrawerFooter>
            <Button variant="solid" color="success" x-on:click={`$store.drawers.rightDrawer${index} = false`}>確定</Button>
            <Button variant="outline" color="warning" x-on:click={`$store.drawers.rightDrawer${index} = false`}>取消</Button>
          </DrawerFooter>
        </>
      )
    });
    return { variant: v, drawer, index };
  }));

  const colorItems = await Promise.all(colors.map(async (c, index) => {
    const drawer = await Drawer({
      state: `colorDrawer${index}`,
      position: "left",
      variant: "solid",
      color: c,
      children: (
        <>
          <DrawerTitle>{c!.charAt(0).toUpperCase() + c!.slice(1)} Drawer</DrawerTitle>
          <p class="text-sm opacity-80 w-full">這是 {c} 顏色的 Drawer。</p>
          <DrawerFooter>
            <Button variant="solid" color={c!} x-on:click={`$store.drawers.colorDrawer${index} = false`}>關閉</Button>
          </DrawerFooter>
        </>
      )
    });
    return { color: c, drawer, index };
  }));

  const backdropOffDrawer = await Drawer({
    state: "backdropOffDrawer",
    position: "left",
    variant: "solid",
    color: "primary",
    closeOnBackdrop: false,
    children: (
      <>
        <DrawerTitle>點擊背景不關閉</DrawerTitle>
        <p class="text-sm opacity-80 w-full">這個 Drawer 點擊背景不會關閉，只能按 ESC 或點擊按鈕關閉。</p>
        <DrawerFooter>
          <Button variant="solid" color="error" x-on:click="$store.drawers.backdropOffDrawer = false">關閉</Button>
        </DrawerFooter>
      </>
    )
  });

  const escOffDrawer = await Drawer({
    state: "escOffDrawer",
    position: "right",
    variant: "solid",
    color: "secondary",
    closeOnEsc: false,
    children: (
      <>
        <DrawerTitle>ESC 不關閉</DrawerTitle>
        <p class="text-sm opacity-80 w-full">這個 Drawer 按 ESC 不會關閉，只能點擊背景或按鈕關閉。</p>
        <DrawerFooter>
          <Button variant="solid" color="error" x-on:click="$store.drawers.escOffDrawer = false">關閉</Button>
        </DrawerFooter>
      </>
    )
  });

  const bothOffDrawer = await Drawer({
    state: "bothOffDrawer",
    position: "left",
    variant: "outline",
    color: "accent",
    closeOnBackdrop: false,
    closeOnEsc: false,
    children: (
      <>
        <DrawerTitle>只能按鈕關閉</DrawerTitle>
        <p class="text-sm opacity-80 w-full">這個 Drawer 點擊背景和按 ESC 都不會關閉，只能點擊按鈕。</p>
        <DrawerFooter>
          <Button variant="solid" color="error" x-on:click="$store.drawers.bothOffDrawer = false">關閉</Button>
        </DrawerFooter>
      </>
    )
  });

  const longContentDrawer = await Drawer({
    state: "longContentDrawer",
    position: "left",
    variant: "solid",
    color: "primary",
    width: "md",
    children: (
      <>
        <DrawerTitle>極限測試：超長內容</DrawerTitle>
        <div class="w-full space-y-4">
          <p class="text-sm opacity-80">這個 Drawer 包含超長內容，用來測試 max-h-screen 和 overflow-y-auto 是否正常運作。</p>
          <p class="font-bold">第一章：開始</p>
          <p>在很久很久以前，有一個王國，王國裡住著各種各樣的人。他們每天忙碌地生活著，從早到晚不停地工作。有些人種田，有些人打鐵，有些人經商，每個人都有自己的故事。</p>
          <p>村莊裡有一位年輕的鐵匠，名叫阿明。他每天天還沒亮就起床，點燃爐火，開始一天的鍛造工作。他的手藝精湛，打造出的器具遠近聞名。</p>
          <p class="font-bold">第二章：旅程</p>
          <p>有一天，阿明收到了一封來自遠方的信。信上說，王國的公主被一條巨龍困在了高山上，需要一把特殊的劍才能解救她。阿明決定踏上旅程。</p>
          <p>他走過了茂密的森林，森林裡的樹木高大得遮住了天空，陽光只能從縫隙中灑落。他聽到了各種鳥鳴和蟲叫，感受到了大自然的寧靜與神秘。</p>
          <p>他翻過了陡峭的山嶺，山上的風很大，吹得他幾乎站不穩。但他沒有放棄，一步一步地往上爬。每當他覺得累了，就抬頭看看山頂，告訴自己再堅持一下。</p>
          <p>他渡過了寬闊的河流，河水冰冷刺骨，但他依然奮力游到了對岸。在河的對岸，他遇到了一位老漁夫，老漁夫告訴他，巨龍的洞穴就在前方不遠處。</p>
          <p class="font-bold">第三章：挑戰</p>
          <p>阿明終於來到了巨龍的洞穴前。洞穴的入口散發著灼熱的氣息，地面上佈滿了焦黑的痕跡。他深吸一口氣，握緊了手中的劍，走了進去。</p>
          <p>洞穴裡面比他想像的還要大，牆壁上閃爍著奇異的光芒。巨龍盤踞在洞穴深處，它的身體像一座小山，眼睛像兩團燃燒的火焰。</p>
          <p>「你是誰？竟敢闖入我的領地！」巨龍發出了震耳欲聾的吼聲。</p>
          <p>「我是鐵匠阿明，我來是為了救出公主！」阿明雖然害怕，但他的聲音依然堅定。</p>
          <p class="font-bold">第四章：對決</p>
          <p>巨龍噴出了一道火焰，阿明靈巧地閃開了。他用劍砍向巨龍，但巨龍的鱗片堅硬如鐵，劍刃在上面只留下了一道淺淺的痕跡。</p>
          <p>阿明想起了老師傅曾經教過他的話：「真正的力量不在於劍的鋒利，而在於使用劍的人的心。」他閉上眼睛，讓自己的心平靜下來。</p>
          <p>當他再次睜開眼睛時，他看到了巨龍的弱點——在它的左胸處，有一小片沒有鱗片覆蓋的地方。阿明集中全力，一劍刺了過去。</p>
          <p class="font-bold">第五章：歸來</p>
          <p>巨龍倒下了，公主得救了。公主感謝阿明的勇敢和堅持，兩人一起回到了王國。國王為阿明舉辦了盛大的慶典，全國的人民都為他歡呼。</p>
          <p>從此以後，阿明不再只是個鐵匠，他成為了王國的英雄。但他依然每天早起，點燃爐火，打造著精美的器具。因為他知道，真正的幸福不在於榮耀，而在於做自己熱愛的事。</p>
          <p class="font-bold">第六章：後記</p>
          <p>如果你能看到這裡，代表我們的 Drawer 滾動功能運作正常！🎉</p>
        </div>
        <DrawerFooter>
          <Button variant="solid" color="error" x-on:click="$store.drawers.longContentDrawer = false">關閉</Button>
        </DrawerFooter>
      </>
    )
  });

  const rightDrawer = await Drawer({
    state: "rightDrawer",
    position: "right",
    variant: "solid",
    color: "info",
    width: "md",
    children: (
      <>
        <DrawerTitle>右側 Drawer</DrawerTitle>
        <p class="text-sm opacity-80 w-full">這是從右側滑入的 Drawer，寬度為 md。</p>
        <DrawerFooter>
          <Button variant="solid" color="info" x-on:click="$store.drawers.rightDrawer = false">關閉</Button>
        </DrawerFooter>
      </>
    )
  });

  const topDrawer = await Drawer({
    state: "topDrawer",
    position: "top",
    variant: "solid",
    color: "success",
    children: (
      <>
        <DrawerTitle>頂部 Drawer</DrawerTitle>
        <p class="text-sm opacity-80 w-full">這是從頂部滑入的 Drawer，適合通知列或搜尋欄。</p>
        <DrawerFooter>
          <Button variant="solid" color="success" x-on:click="$store.drawers.topDrawer = false">關閉</Button>
        </DrawerFooter>
      </>
    )
  });

  const bottomDrawer = await Drawer({
    state: "bottomDrawer",
    position: "bottom",
    variant: "solid",
    color: "warning",
    children: (
      <>
        <DrawerTitle>底部 Drawer</DrawerTitle>
        <p class="text-sm opacity-80 w-full">這是從底部滑入的 Drawer，適合操作面板或篩選器。</p>
        <DrawerFooter>
          <Button variant="solid" color="warning" x-on:click="$store.drawers.bottomDrawer = false">關閉</Button>
        </DrawerFooter>
      </>
    )
  });

  const storeData = `{${[
    ...variants.slice(0, 6).map((_, i) => `leftDrawer${i}: false`),
    ...variants.slice(0, 6).map((_, i) => `rightDrawer${i}: false`),
    ...colors.map((_, i) => `colorDrawer${i}: false`),
    'backdropOffDrawer: false',
    'escOffDrawer: false',
    'bothOffDrawer: false',
    'longContentDrawer: false',
    'rightDrawer: false',
    'topDrawer: false',
    'bottomDrawer: false',
  ].join(', ')}}`;

  return (
    <div x-data x-init={`Alpine.store('drawers', ${storeData})`} class="container mx-auto p-6 space-y-8">

      <section>
        <h1 class="text-3xl font-bold mb-2">Drawer 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Drawer 配置，點擊按鈕開啟側邊欄（使用 Alpine.js Store）</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">左側 Drawer（Variants）</h2>
        <div class="flex flex-wrap gap-3">
          {leftVariantItems.map(({ variant, index }) => (
            <Button variant={variant!} color="primary" x-on:click={`$store.drawers.leftDrawer${index} = true`}>
              ← {variant!.charAt(0).toUpperCase() + variant!.slice(1)}
            </Button>
          ))}
        </div>
        <div class="mt-4">
          {leftVariantItems.map(({ drawer }) => drawer)}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">右側 Drawer（Variants）</h2>
        <div class="flex flex-wrap gap-3">
          {rightVariantItems.map(({ variant, index }) => (
            <Button variant={variant!} color="secondary" x-on:click={`$store.drawers.rightDrawer${index} = true`}>
              {variant!.charAt(0).toUpperCase() + variant!.slice(1)} →
            </Button>
          ))}
        </div>
        <div class="mt-4">
          {rightVariantItems.map(({ drawer }) => drawer)}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">顏色變化（Solid 變體）</h2>
        <div class="flex flex-wrap gap-3">
          {colorItems.map(({ color, index }) => (
            <Button variant="solid" color={color!} x-on:click={`$store.drawers.colorDrawer${index} = true`}>
              {color!.charAt(0).toUpperCase() + color!.slice(1)}
            </Button>
          ))}
        </div>
        <div class="mt-4">
          {colorItems.map(({ drawer }) => drawer)}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">關閉行為測試</h2>
        <div class="flex flex-wrap gap-3">
          <Button variant="solid" color="primary" x-on:click="$store.drawers.backdropOffDrawer = true">
            點擊背景不關閉
          </Button>
          <Button variant="solid" color="secondary" x-on:click="$store.drawers.escOffDrawer = true">
            ESC 不關閉
          </Button>
          <Button variant="outline" color="accent" x-on:click="$store.drawers.bothOffDrawer = true">
            只能按鈕關閉
          </Button>
        </div>
        <div class="mt-4">
          {backdropOffDrawer}
          {escOffDrawer}
          {bothOffDrawer}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">寬度與方向</h2>
        <div class="flex flex-wrap gap-3">
          <Button variant="solid" color="error" x-on:click="$store.drawers.longContentDrawer = true">
            📜 超長內容測試
          </Button>
          <Button variant="solid" color="info" x-on:click="$store.drawers.rightDrawer = true">
            右側寬版 →
          </Button>
        </div>
        <div class="mt-4">
          {longContentDrawer}
          {rightDrawer}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">頂部與底部</h2>
        <div class="flex flex-wrap gap-3">
          <Button variant="solid" color="success" x-on:click="$store.drawers.topDrawer = true">
            ↑ 頂部 Drawer
          </Button>
          <Button variant="solid" color="warning" x-on:click="$store.drawers.bottomDrawer = true">
            ↓ 底部 Drawer
          </Button>
        </div>
        <div class="mt-4">
          {topDrawer}
          {bottomDrawer}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">使用說明</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
            <li><strong>store</strong>: Alpine.js Store 名稱，預設 "drawers"</li>
            <li><strong>state</strong>: Store 中的狀態鍵名，預設 "drawerOpen"</li>
            <li><strong>position</strong>: 滑出方向 "left" | "right" | "top" | "bottom"，預設 "left"</li>
            <li><strong>closeOnBackdrop</strong>: 點擊背景是否關閉，預設 true</li>
            <li><strong>closeOnEsc</strong>: 按 ESC 是否關閉，預設 true</li>
            <li><strong>variant</strong>: Container 樣式變體</li>
            <li><strong>color</strong>: 顏色主題</li>
            <li><strong>width</strong>: 寬度設定，預設 "sm"</li>
            <li><strong>rounded</strong>: 圓角，預設 "none"</li>
            <li><strong>shadow</strong>: 陰影，預設 "lg"</li>
            <li><strong>DrawerTitle</strong>: 標題子組件</li>
            <li><strong>DrawerFooter</strong>: 底部按鈕區子組件（自動推到底部）</li>
            <li>需先註冊 Store：<code>Alpine.store('drawers', {'{'} myDrawer: false {'}'})</code></li>
            <li>開啟：<code>x-on:click="$store.drawers.myDrawer = true"</code></li>
            <li>關閉：<code>x-on:click="$store.drawers.myDrawer = false"</code></li>
            <li>按鈕與 Drawer 不再需要 <code>x-data</code> 包裹，可放在頁面任意位置</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
