import Steps, { Step } from "../components/Steps/index.tsx";

export default async function StepsTestPage() {
  const horizontalSteps = (
    <Steps>
      <Step active index={0}>Register</Step>
      <Step active index={1}>Choose plan</Step>
      <Step index={2}>Purchase</Step>
      <Step index={3}>Receive Product</Step>
    </Steps>
  );

  const verticalSteps = (
    <Steps vertical>
      <Step active index={0}>Register</Step>
      <Step active index={1}>Choose plan</Step>
      <Step index={2}>Purchase</Step>
      <Step index={3}>Receive Product</Step>
    </Steps>
  );



  const stepsWithIcons = (
    <Steps>
      <Step active icon="😕" index={0}>Step 1</Step>
      <Step active icon="😃" index={1}>Step 2</Step>
      <Step icon="😍" index={2}>Step 3</Step>
    </Steps>
  );

  const stepsWithDataContent = (
    <Steps>
      <Step dataContent="?" index={0}>Step 1</Step>
      <Step dataContent="!" index={1}>Step 2</Step>
      <Step dataContent="✓" index={2}>Step 3</Step>
      <Step dataContent="✕" index={3}>Step 4</Step>
      <Step dataContent="★" index={4}>Step 5</Step>
    </Steps>
  );

  const stepsWithColors = (
    <Steps>
      <Step active color="info" index={0}>Fly to moon</Step>
      <Step active color="info" index={1}>Shrink the moon</Step>
      <Step active color="info" index={2}>Grab the moon</Step>
      <Step active color="error" dataContent="?" index={3}>Sit on toilet</Step>
    </Steps>
  );

  const scrollableSteps = (
    <div class="overflow-x-auto">
      <Steps>
        <Step index={0}>start</Step>
        <Step active color="secondary" index={1}>2</Step>
        <Step active color="secondary" index={2}>3</Step>
        <Step active color="secondary" index={3}>4</Step>
        <Step index={4}>5</Step>
        <Step active color="accent" index={5}>6</Step>
        <Step active color="accent" index={6}>7</Step>
        <Step index={7}>8</Step>
        <Step active color="error" index={8}>9</Step>
        <Step active color="error" index={9}>10</Step>
        <Step index={10}>11</Step>
        <Step index={11}>12</Step>
        <Step active color="warning" index={12}>13</Step>
        <Step active color="warning" index={13}>14</Step>
        <Step index={14}>15</Step>
        <Step active color="neutral" index={15}>16</Step>
        <Step active color="neutral" index={16}>17</Step>
        <Step active color="neutral" index={17}>18</Step>
        <Step active color="neutral" index={18}>19</Step>
        <Step active color="neutral" index={19}>20</Step>
        <Step active color="neutral" index={20}>21</Step>
        <Step active color="neutral" index={21}>22</Step>
        <Step active color="neutral" index={22}>23</Step>
        <Step index={23}>end</Step>
      </Steps>
    </div>
  );

  const stepsWithMixedStates = (
    <Steps>
      <Step active color="success" index={0}>Completed Step</Step>
      <Step active color="primary" index={1}>Current Step</Step>
      <Step index={2}>Next Step</Step>
      <Step disabled index={3}>Disabled Step</Step>
    </Steps>
  );

  const stepsWithoutActive = (
    <Steps>
      <Step active color="success" index={0}>Completed Step</Step>
      <Step color="primary" index={1}>No Active Step</Step>
      <Step index={2}>Next Step</Step>
      <Step disabled index={3}>Disabled Step</Step>
    </Steps>
  );

  const stepsWithVariants = (
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold mb-2">Solid Variant</h3>
        <Steps variant="solid">
          <Step active index={0}>Step 1</Step>
          <Step active index={1}>Step 2</Step>
          <Step index={2}>Step 3</Step>
        </Steps>
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-2">Outline Variant</h3>
        <Steps variant="outline">
          <Step active index={0}>Step 1</Step>
          <Step active index={1}>Step 2</Step>
          <Step index={2}>Step 3</Step>
        </Steps>
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-2">Ghost Variant</h3>
        <Steps variant="crystal">
          <Step active index={0}>Step 1</Step>
          <Step active index={1}>Step 2</Step>
          <Step index={2}>Step 3</Step>
        </Steps>
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-2">Dot Variant</h3>
        <Steps variant="dot">
          <Step active index={0}>Step 1</Step>
          <Step active index={1}>Step 2</Step>
          <Step index={2}>Step 3</Step>
        </Steps>
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-2">Dashed Variant</h3>
        <Steps variant="dashed">
          <Step active index={0}>Step 1</Step>
          <Step active index={1}>Step 2</Step>
          <Step index={2}>Step 3</Step>
        </Steps>
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-2">Double Variant</h3>
        <Steps variant="double">
          <Step active index={0}>Step 1</Step>
          <Step active index={1}>Step 2</Step>
          <Step index={2}>Step 3</Step>
        </Steps>
      </div>
    </div>
  );

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Steps 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Steps 配置</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">水平步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {horizontalSteps}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">垂直步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {verticalSteps}
        </div>
      </section>



      <section>
        <h2 class="text-2xl font-semibold mb-4">帶自定義圖標的步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {stepsWithIcons}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">帶數據內容的步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {stepsWithDataContent}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">帶自定義顏色的步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {stepsWithColors}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">可滾動步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {scrollableSteps}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">混合狀態步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {stepsWithMixedStates}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">無 Active 狀態步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {stepsWithoutActive}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">帶不同 Variant 的步驟</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          {stepsWithVariants}
        </div>
      </section>

      <div class="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li><strong>Steps 組件</strong>：
            <ul class="list-disc list-inside pl-4 mt-1">
              <li><strong>vertical</strong>: 垂直布局</li>
              <li><strong>className</strong>: 額外的 CSS 類名</li>
              <li><strong>variant</strong>: 容器變體（solid、outline、ghost、dot、dashed、double、gradient-*、crystal、diagonal-stripes、glow、minimalist）</li>
            </ul>
          </li>
          <li><strong>Step 組件</strong>：
            <ul class="list-disc list-inside pl-4 mt-1">
              <li><strong>active</strong>: 激活狀態</li>
              <li><strong>completed</strong>: 完成狀態</li>
              <li><strong>disabled</strong>: 禁用狀態</li>
              <li><strong>color</strong>: 步驟顏色</li>
              <li><strong>icon</strong>: 自定義圖標</li>
              <li><strong>dataContent</strong>: 自定義數據內容</li>
              <li><strong>index</strong>: 步驟編號（從 0 開始）</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
