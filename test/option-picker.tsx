import OptionPicker from '../components/OptionPicker/OptionPicker.tsx';
import Span from '../components/Span.tsx';
import Icon from '../components/Icon.tsx';

export default async function OptionPickerTestPage() {
  // 文字選項範例
  const textOptions = [
    { value: 'small', content: <Span>小</Span> },
    { value: 'medium', content: <Span>中</Span> },
    { value: 'large', content: <Span>大</Span> },
    { value: 'xlarge', content: <Span>特大</Span> },
  ];

  // 圖示選項範例
  const iconOptions = [
    { value: 'grid', content: <Icon id="grid" size="xl" /> },
    { value: 'list', content: <Icon id="list" size="xl" /> },
    { value: 'card', content: <Icon id="card" size="xl" /> },
    { value: 'map', content: <Icon id="map" size="xl" /> },
  ];

  // 顏色選項範例
  const colorOptions = [
    { value: 'red', content: <div class="w-8 h-8 rounded-full bg-red-500" /> },
    { value: 'blue', content: <div class="w-8 h-8 rounded-full bg-blue-500" /> },
    { value: 'green', content: <div class="w-8 h-8 rounded-full bg-green-500" /> },
    { value: 'yellow', content: <div class="w-8 h-8 rounded-full bg-yellow-500" /> },
    { value: 'purple', content: <div class="w-8 h-8 rounded-full bg-purple-500" /> },
  ];

  // 組合內容選項範例
  const comboOptions = [
    { 
      value: 'basic', 
      content: (
        <div class="flex flex-col items-center gap-sm">
          <Icon id="star" size="lg" />
          <Span>基礎方案</Span>
        </div>
      )
    },
    { 
      value: 'pro', 
      content: (
        <div class="flex flex-col items-center gap-sm">
          <Icon id="diamond" size="lg" />
          <Span>專業方案</Span>
        </div>
      )
    },
    { 
      value: 'enterprise', 
      content: (
        <div class="flex flex-col items-center gap-sm">
          <Icon id="building" size="lg" />
          <Span>企業方案</Span>
        </div>
      )
    },
  ];

  // 禁用選項範例
  const disabledOptions = [
    { value: 'option1', content: <Span>選項 1</Span> },
    { value: 'option2', content: <Span>選項 2</Span>, disabled: true },
    { value: 'option3', content: <Span>選項 3</Span> },
    { value: 'option4', content: <Span>選項 4</Span> },
  ];

  return (
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">OptionPicker 選項選擇器測試</h1>

      {/* 單選文字選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 文字選項</h2>
        <OptionPicker 
          mode="single" 
          options={textOptions}
          selectedValues={['medium']}
        />
      </section>

      {/* 多選圖示選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">多選模式 - 圖示選項</h2>
        <OptionPicker 
          mode="multiple" 
          options={iconOptions}
          selectedValues={['grid', 'card']}
          variant="solid"
        />
      </section>

      {/* 顏色選擇 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 顏色選擇</h2>
        <OptionPicker 
          mode="single" 
          options={colorOptions}
          selectedValues={['blue']}
          variant="ghost"
          rounded="lg"
        />
      </section>

      {/* 組合內容選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 組合內容選項</h2>
        <OptionPicker 
          mode="single" 
          options={comboOptions}
          selectedValues={['pro']}
          variant="outline"
          color="primary"
          padding="lg"
        />
      </section>

      {/* 禁用選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">包含禁用選項</h2>
        <OptionPicker 
          mode="single" 
          options={disabledOptions}
          selectedValues={['option1']}
        />
      </section>

      {/* 說明 */}
      <section class="mt-8 p-4 bg-gray-100 rounded">
        <h3 class="font-bold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>mode="single"</strong>: 單選模式，類似 Radio</li>
          <li><strong>mode="multiple"</strong>: 多選模式，類似 Checkbox</li>
          <li><strong>variant</strong>: Container 容器樣式 (solid, outline, ghost, dot, dashed, etc.)</li>
          <li><strong>color</strong>: Container 容器顏色</li>
          <li><strong>autoFill</strong>: 是否使用 Flex 自動填滿空間</li>
          <li><strong>disabled</strong>: 選項可以設定為禁用狀態</li>
        </ul>
      </section>
    </div>
  );
}