import Modal, { ModalTitle, ModalFooter, ModalProps } from '../components/Modal/index.tsx';
import Button from '../components/Button/index.tsx';

export default async function ModalTestPage() {
  const variants: ModalProps['variant'][] = [
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

  const colors: ModalProps['color'][] = [
    "primary",
    "secondary",
    "accent",
    "info",
    "success",
    "warning",
    "error"
  ];

  const variantItems = await Promise.all(variants.map(async (v, index) => {
    const modal = await Modal({
      state: `modal${index}`,
      variant: v,
      color: "primary",
      children: (
        <>
          <ModalTitle>{v!.charAt(0).toUpperCase() + v!.slice(1)} Modal</ModalTitle>
          <p class="text-sm opacity-80 w-full">這是 {v} 樣式的 Modal 對話框。</p>
          <ModalFooter>
            <Button variant="solid" color="success" x-on:click={`$store.modals.modal${index} = false`}>確定</Button>
            <Button variant="outline" color="warning" x-on:click={`$store.modals.modal${index} = false`}>取消</Button>
          </ModalFooter>
        </>
      )
    });
    return { variant: v, modal, index };
  }));

  const colorItems = await Promise.all(colors.map(async (c, index) => {
    const modal = await Modal({
      state: `colorModal${index}`,
      variant: "solid",
      color: c,
      children: (
        <>
          <ModalTitle>{c!.charAt(0).toUpperCase() + c!.slice(1)} Modal</ModalTitle>
          <p class="text-sm opacity-80 w-full">這是 {c} 顏色的 Modal。</p>
          <ModalFooter>
            <Button variant="solid" color={c!} x-on:click={`$store.modals.colorModal${index} = false`}>關閉</Button>
          </ModalFooter>
        </>
      )
    });
    return { color: c, modal, index };
  }));

  const backdropOffModal = await Modal({
    state: "backdropOffModal",
    variant: "solid",
    color: "primary",
    closeOnBackdrop: false,
    children: (
      <>
        <ModalTitle>點擊背景不關閉</ModalTitle>
        <p class="text-sm opacity-80 w-full">這個 Modal 點擊背景不會關閉，只能按 ESC 或點擊按鈕關閉。</p>
        <ModalFooter>
          <Button variant="solid" color="error" x-on:click="$store.modals.backdropOffModal = false">關閉</Button>
        </ModalFooter>
      </>
    )
  });

  const escOffModal = await Modal({
    state: "escOffModal",
    variant: "solid",
    color: "secondary",
    closeOnEsc: false,
    children: (
      <>
        <ModalTitle>ESC 不關閉</ModalTitle>
        <p class="text-sm opacity-80 w-full">這個 Modal 按 ESC 不會關閉，只能點擊背景或按鈕關閉。</p>
        <ModalFooter>
          <Button variant="solid" color="error" x-on:click="$store.modals.escOffModal = false">關閉</Button>
        </ModalFooter>
      </>
    )
  });

  const bothOffModal = await Modal({
    state: "bothOffModal",
    variant: "outline",
    color: "accent",
    closeOnBackdrop: false,
    closeOnEsc: false,
    children: (
      <>
        <ModalTitle>只能按鈕關閉</ModalTitle>
        <p class="text-sm opacity-80 w-full">這個 Modal 點擊背景和按 ESC 都不會關閉，只能點擊按鈕。</p>
        <ModalFooter>
          <Button variant="solid" color="error" x-on:click="$store.modals.bothOffModal = false">關閉</Button>
        </ModalFooter>
      </>
    )
  });

  const widthModal = await Modal({
    state: "widthModal",
    variant: "solid",
    color: "primary",
    width: "lg",
    children: (
      <>
        <ModalTitle>寬版 Modal</ModalTitle>
        <p class="text-sm opacity-80 w-full">這是一個寬版 Modal，適合顯示較多內容。</p>
        <ModalFooter>
          <Button variant="solid" color="success" x-on:click="$store.modals.widthModal = false">關閉</Button>
        </ModalFooter>
      </>
    )
  });

  const customStateModal = await Modal({
    state: "myDialog",
    variant: "ghost",
    color: "info",
    children: (
      <>
        <ModalTitle>自訂狀態名稱</ModalTitle>
        <p class="text-sm opacity-80 w-full">這個 Modal 使用自訂的 Alpine.js Store 狀態鍵名 <code>myDialog</code>。</p>
        <ModalFooter>
          <Button variant="solid" color="info" x-on:click="$store.modals.myDialog = false">關閉</Button>
        </ModalFooter>
      </>
    )
  });

  const longContentModal = await Modal({
    state: "longContentModal",
    variant: "solid",
    color: "primary",
    width: "xl",
    children: (
      <>
        <ModalTitle>極限測試：超長內容</ModalTitle>
        <div class="w-full space-y-4">
          <p class="text-sm opacity-80">這個 Modal 包含超長內容，用來測試 max-h-[85vh] 和 overflow-y-auto 是否正常運作。</p>
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
          <p class="font-bold">第六章：新的開始</p>
          <p>故事到這裡並沒有結束。阿明和公主結婚後，一起治理著王國。他們建立了一座學校，讓每個孩子都能學習知識和技能。他們還修建了道路和橋樑，讓人們的出行更加方便。</p>
          <p>王國變得越來越繁榮，人們的生活越來越好。而阿明和公主的故事，也被一代一代地傳頌下去，成為了王國最美麗的傳說。</p>
          <p class="font-bold">第七章：後記</p>
          <p>如果你能看到這裡，代表我們的 Modal 滾動功能運作正常！🎉 這個極限測試確保了即使內容非常長，Modal 也不會超出視窗範圍，使用者可以順利滾動查看所有內容。</p>
        </div>
        <ModalFooter>
          <Button variant="solid" color="error" x-on:click="$store.modals.longContentModal = false">關閉</Button>
        </ModalFooter>
      </>
    )
  });

  const storeData = `{${[
    ...variants.map((_, i) => `modal${i}: false`),
    ...colors.map((_, i) => `colorModal${i}: false`),
    'backdropOffModal: false',
    'escOffModal: false',
    'bothOffModal: false',
    'widthModal: false',
    'myDialog: false',
    'longContentModal: false',
  ].join(', ')}}`;

  return (
    <div x-data x-init={`Alpine.store('modals', ${storeData})`} class="container mx-auto p-6 space-y-8">

      <section>
        <h1 class="text-3xl font-bold mb-2">Modal 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Modal 配置，點擊按鈕開啟對話框（使用 Alpine.js Store）</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">所有變體（Variants）</h2>
        <div class="flex flex-wrap gap-3">
          {variantItems.map(({ variant, index }) => (
            <Button variant={variant!} color="primary" x-on:click={`$store.modals.modal${index} = true`}>
              {variant!.charAt(0).toUpperCase() + variant!.slice(1)}
            </Button>
          ))}
        </div>
        <div class="mt-4">
          {variantItems.map(({ modal }) => modal)}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">顏色變化（Solid 變體）</h2>
        <div class="flex flex-wrap gap-3">
          {colorItems.map(({ color, index }) => (
            <Button variant="solid" color={color!} x-on:click={`$store.modals.colorModal${index} = true`}>
              {color!.charAt(0).toUpperCase() + color!.slice(1)}
            </Button>
          ))}
        </div>
        <div class="mt-4">
          {colorItems.map(({ modal }) => modal)}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">關閉行為測試</h2>
        <div class="flex flex-wrap gap-3">
          <Button variant="solid" color="primary" x-on:click="$store.modals.backdropOffModal = true">
            點擊背景不關閉
          </Button>
          <Button variant="solid" color="secondary" x-on:click="$store.modals.escOffModal = true">
            ESC 不關閉
          </Button>
          <Button variant="outline" color="accent" x-on:click="$store.modals.bothOffModal = true">
            只能按鈕關閉
          </Button>
        </div>
        <div class="mt-4">
          {backdropOffModal}
          {escOffModal}
          {bothOffModal}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">寬度與自訂狀態</h2>
        <div class="flex flex-wrap gap-3">
          <Button variant="solid" color="primary" x-on:click="$store.modals.widthModal = true">
            寬版 Modal
          </Button>
          <Button variant="ghost" color="info" x-on:click="$store.modals.myDialog = true">
            自訂狀態名稱
          </Button>
        </div>
        <div class="mt-4">
          {widthModal}
          {customStateModal}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">極限測試：超長內容</h2>
        <Button variant="solid" color="error" x-on:click="$store.modals.longContentModal = true">
          📜 超長內容測試
        </Button>
        <div class="mt-4">
          {longContentModal}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">使用說明</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
            <li><strong>store</strong>: Alpine.js Store 名稱，預設 "modals"</li>
            <li><strong>state</strong>: Store 中的狀態鍵名，預設 "modalOpen"</li>
            <li><strong>closeOnBackdrop</strong>: 點擊背景是否關閉，預設 true</li>
            <li><strong>closeOnEsc</strong>: 按 ESC 是否關閉，預設 true</li>
            <li><strong>variant</strong>: Container 樣式變體</li>
            <li><strong>color</strong>: 顏色主題</li>
            <li><strong>width</strong>: 寬度設定，預設 "md"</li>
            <li><strong>rounded</strong>: 圓角，預設 "lg"</li>
            <li><strong>shadow</strong>: 陰影，預設 "lg"</li>
            <li><strong>ModalTitle</strong>: 標題子組件</li>
            <li><strong>ModalFooter</strong>: 底部按鈕區子組件</li>
            <li>需先註冊 Store：<code>Alpine.store('modals', {'{'} myModal: false {'}'})</code></li>
            <li>開啟：<code>x-on:click="$store.modals.myModal = true"</code></li>
            <li>關閉：<code>x-on:click="$store.modals.myModal = false"</code></li>
            <li>按鈕與 Modal 不再需要 <code>x-data</code> 包裹，可放在頁面任意位置</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
