import OptionPicker, { OptionItem } from '../components/OptionPicker/index.tsx';
import Span from '../components/Span.tsx';
import Icon from '../components/Icon.tsx';

export default async function OptionPickerTestPage() {
  return (
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">OptionPicker 選項選擇器測試</h1>

      {/* 單選文字選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 文字選項</h2>
        <OptionPicker 
          mode="single" 
          selectedValues={['medium']}
        >
          <OptionItem value="small">
            <Span>小</Span>
          </OptionItem>
          <OptionItem value="medium">
            <Span>中</Span>
          </OptionItem>
          <OptionItem value="large">
            <Span>大</Span>
          </OptionItem>
          <OptionItem value="xlarge">
            <Span>特大</Span>
          </OptionItem>
        </OptionPicker>
      </section>

      {/* 多選圖示選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">多選模式 - 圖示選項</h2>
        <OptionPicker 
          mode="multiple" 
          selectedValues={['grid', 'card']}
          variant="solid"
        >
          <OptionItem value="grid">
            <Icon id="grid" size="xl" />
          </OptionItem>
          <OptionItem value="list">
            <Icon id="list" size="xl" />
          </OptionItem>
          <OptionItem value="card">
            <Icon id="card" size="xl" />
          </OptionItem>
          <OptionItem value="map">
            <Icon id="map" size="xl" />
          </OptionItem>
        </OptionPicker>
      </section>

      {/* 顏色選擇 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 顏色選擇</h2>
        <OptionPicker 
          mode="single" 
          selectedValues={['blue']}
          variant="ghost"
          rounded="lg"
        >
          <OptionItem value="red">
            <div class="w-8 h-8 rounded-full bg-red-500" />
          </OptionItem>
          <OptionItem value="blue">
            <div class="w-8 h-8 rounded-full bg-blue-500" />
          </OptionItem>
          <OptionItem value="green">
            <div class="w-8 h-8 rounded-full bg-green-500" />
          </OptionItem>
          <OptionItem value="yellow">
            <div class="w-8 h-8 rounded-full bg-yellow-500" />
          </OptionItem>
          <OptionItem value="purple">
            <div class="w-8 h-8 rounded-full bg-purple-500" />
          </OptionItem>
        </OptionPicker>
      </section>

      {/* 組合內容選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 組合內容選項</h2>
        <OptionPicker 
          mode="single" 
          selectedValues={['pro']}
          variant="outline"
          color="primary"
          padding="lg"
        >
          <OptionItem value="basic">
            <div class="flex flex-col items-center gap-sm">
              <Icon id="star" size="lg" />
              <Span>基礎方案</Span>
            </div>
          </OptionItem>
          <OptionItem value="pro">
            <div class="flex flex-col items-center gap-sm">
              <Icon id="diamond" size="lg" />
              <Span>專業方案</Span>
            </div>
          </OptionItem>
          <OptionItem value="enterprise">
            <div class="flex flex-col items-center gap-sm">
              <Icon id="building" size="lg" />
              <Span>企業方案</Span>
            </div>
          </OptionItem>
        </OptionPicker>
      </section>

      {/* 禁用選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">包含禁用選項</h2>
        <OptionPicker 
          mode="single" 
          selectedValues={['option1']}
        >
          <OptionItem value="option1">
            <Span>選項 1</Span>
          </OptionItem>
          <OptionItem value="option2" disabled={true}>
            <Span>選項 2</Span>
          </OptionItem>
          <OptionItem value="option3">
            <Span>選項 3</Span>
          </OptionItem>
          <OptionItem value="option4">
            <Span>選項 4</Span>
          </OptionItem>
        </OptionPicker>
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