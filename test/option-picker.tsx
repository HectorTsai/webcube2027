import OptionPicker, { OptionItem } from '../components/OptionPicker/index.tsx';
import Span from '../components/Span.tsx';
import Icon from '../components/Icon.tsx';

const svgSet = {
  grid: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z"/></svg>',
  list: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/></svg>',
  card: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v12h16V6H4zm1 2h14v3H5V8zm0 5h14v3H5v-3z"/></svg>',
  map: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>',
  star: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  diamond: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.41L18.59 12 12 18.59 5.41 12 12 5.41z"/></svg>',
  building: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
};

export default async function OptionPickerTestPage() {
  return (
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">OptionPicker 選項選擇器測試</h1>

      {/* 單選文字選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 文字選項</h2>
        <div>
          <p class="mb-2">目前選中：<span x-text="(() => { const s = $store.Container || {}; const k = Object.keys(s).filter(k => k.startsWith('size_') && s[k]); return k.length > 0 ? k[0].replace('size_', '') : '無'; })()"></span></p>
          <OptionPicker mode="single" name="size" gap="none" rounded="none" variant="solid" color="primary">
            <OptionItem value="small">
              <Span>小</Span>
            </OptionItem>
            <OptionItem value="medium" checked>
              <Span>中</Span>
            </OptionItem>
            <OptionItem value="large">
              <Span>大</Span>
            </OptionItem>
            <OptionItem value="xlarge">
              <Span>特大</Span>
            </OptionItem>
          </OptionPicker>
        </div>
      </section>

      {/* 多選圖示選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">多選模式 - 圖示選項</h2>
        <div>
          <p class="mb-2">目前選中：<span x-text="(() => { const s = $store.Container || {}; return Object.keys(s).filter(k => k.startsWith('viewType_') && s[k]).map(k => k.replace('viewType_', '')).join(', ') || '無'; })()"></span></p>
          <OptionPicker mode="multiple" name="viewType" variant="solid" color="info">
            <OptionItem value="grid" checked>
              <Icon svg={svgSet.grid} size="xl" />
            </OptionItem>
            <OptionItem value="list">
              <Icon svg={svgSet.list} size="xl" />
            </OptionItem>
            <OptionItem value="card" checked>
              <Icon svg={svgSet.card} size="xl" />
            </OptionItem>
            <OptionItem value="map">
              <Icon svg={svgSet.map} size="xl" />
            </OptionItem>
          </OptionPicker>
        </div>
      </section>

      {/* 顏色選擇 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 顏色選擇</h2>
        <div>
          <p class="mb-2">目前選中：<span x-text="(() => { const s = $store.Container || {}; const k = Object.keys(s).filter(k => k.startsWith('color_') && s[k]); return k.length > 0 ? k[0].replace('color_', '') : '無'; })()"></span></p>
          <OptionPicker mode="single" name="color" variant="gradient-down" color="warning">
            <OptionItem value="red">
              <div class="w-8 h-8 rounded-full bg-red-500" />
            </OptionItem>
            <OptionItem value="blue" checked>
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
        </div>
      </section>

      {/* 組合內容選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">單選模式 - 組合內容選項</h2>
        <div>
          <p class="mb-2">目前選中：<span x-text="(() => { const s = $store.Container || {}; const k = Object.keys(s).filter(k => k.startsWith('plan_') && s[k]); return k.length > 0 ? k[0].replace('plan_', '') : '無'; })()"></span></p>
          <OptionPicker mode="single" name="plan" variant="outline" color="success" padding="lg">
            <OptionItem value="basic">
              <div class="flex flex-col items-center gap-sm">
                <Icon svg={svgSet.star} size="lg" />
                <Span>基礎方案</Span>
              </div>
            </OptionItem>
            <OptionItem value="pro" checked>
              <div class="flex flex-col items-center gap-sm">
                <Icon svg={svgSet.diamond} size="lg" />
                <Span>專業方案</Span>
              </div>
            </OptionItem>
            <OptionItem value="enterprise">
              <div class="flex flex-col items-center gap-sm">
                <Icon svg={svgSet.building} size="lg" />
                <Span>企業方案</Span>
              </div>
            </OptionItem>
          </OptionPicker>
        </div>
      </section>

      {/* 禁用選項 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">包含禁用選項</h2>
        <div>
          <p class="mb-2">目前選中：<span x-text="(() => { const s = $store.Container || {}; const k = Object.keys(s).filter(k => k.startsWith('opt_') && s[k]); return k.length > 0 ? k[0].replace('opt_', '') : '無'; })()"></span></p>
          <OptionPicker mode="single" name="opt" variant="crystal" color="error">
            <OptionItem value="option1" checked>
              <Span>選項 1</Span>
            </OptionItem>
            <OptionItem value="option2" disabled>
              <Span>選項 2</Span>
            </OptionItem>
            <OptionItem value="option3">
              <Span>選項 3</Span>
            </OptionItem>
            <OptionItem value="option4">
              <Span>選項 4</Span>
            </OptionItem>
          </OptionPicker>
        </div>
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
          <li><strong>checked</strong>: 預設選中該選項</li>
        </ul>
      </section>
    </div>
  );
}