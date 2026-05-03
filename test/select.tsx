import Select, { SelectProps, Option } from '../components/Select/index.tsx';
import Icon from '../components/Icon.tsx';

export default function SelectTestPage() {
  const variants: SelectProps['variant'][] = [
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
  
  const colors: SelectProps['color'][] = [
    "primary",
    "secondary",
    "accent",
    "info",
    "success",
    "warning",
    "error",
    "neutral"
  ];

  // 测试基本 Select 组件
  const basicSelect = (
    <Select state="basicSelect" placeholder="選擇一個選項">
      <Option value="option1">選項 1</Option>
      <Option value="option2">選項 2</Option>
      <Option value="option3">選項 3</Option>
    </Select>
  );

  // 测试带图标的 Select
  const iconSelect = (
    <Select state="iconSelect" placeholder="選擇一個圖示選項">
      <Option value="home">
        <Icon id="圖示:圖示:home" class="w-4 h-4 mr-2" />
        首頁
      </Option>
      <Option value="settings">
        <Icon id="圖示:圖示:info" class="w-4 h-4 mr-2" />
        設定
      </Option>
      <Option value="user">
        <Icon id="圖示:圖示:user" class="w-4 h-4 mr-2" />
        用戶
      </Option>
      <Option value="divider" divider />
      <Option value="logout">
        <Icon id="圖示:圖示:phone" class="w-4 h-4 mr-2" />
        登出
      </Option>
    </Select>
  );

  // 测试禁用状态
  const disabledSelect = (
    <Select state="disabledSelect" placeholder="禁用的選擇框" disabled>
      <Option value="option1">選項 1</Option>
      <Option value="option2">選項 2</Option>
    </Select>
  );

  // 测试禁用选项
  const disabledOptionSelect = (
    <Select state="disabledOptionSelect" placeholder="包含禁用選項">
      <Option value="option1">正常選項</Option>
      <Option value="option2" disabled>禁用選項</Option>
      <Option value="option3">另一個正常選項</Option>
    </Select>
  );

  // 测试默认值
  const defaultValueSelect = (
    <Select state="defaultValueSelect" defaultValue="option2" placeholder="有預設值的選擇框">
      <Option value="option1">選項 1</Option>
      <Option value="option2">選項 2（預設）</Option>
      <Option value="option3">選項 3</Option>
    </Select>
  );

  // 將 variant 名稱轉換成駝峰式命名（移除連字號）
  const toCamelCase = (str: string) => {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  };

  // 测试变体 Select
  const variantSelects = variants.map((variant) => {
    const variantName = variant!.charAt(0).toUpperCase() + variant!.slice(1);
    const stateName = `variant${toCamelCase(variantName)}`;
    const select = (
      <Select state={stateName} variant={variant!} color="primary" placeholder={`${variantName} 變體`}>
        <Option value="option1">選項 1</Option>
        <Option value="option2">選項 2</Option>
        <Option value="option3">選項 3</Option>
      </Select>
    );
    return { variant, select };
  });

  // 测试颜色 Select
  const colorSelects = colors.map((color) => {
    const colorName = color!.charAt(0).toUpperCase() + color!.slice(1);
    const stateName = `color${colorName}`;
    const select = (
      <Select state={stateName} variant="solid" color={color!} placeholder={`${colorName} 顏色`}>
        <Option value="option1">選項 1</Option>
        <Option value="option2">選項 2</Option>
        <Option value="option3">選項 3</Option>
      </Select>
    );
    return { color, select };
  });

  return (
    <div class="container mx-auto p-6 space-y-8">
      <section>
        <h1 class="text-3xl font-bold mb-2">Select 組件測試</h1>
        <p class="text-base-content/70">以下展示各種 Select 配置，支援在選項中使用圖示</p>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">基本用法</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-medium mb-2">基本選擇框</h3>
            {basicSelect}
          </div>
          <div>
            <h3 class="text-lg font-medium mb-2">帶圖示的選擇框</h3>
            {iconSelect}
          </div>
          <div>
            <h3 class="text-lg font-medium mb-2">禁用狀態</h3>
            {disabledSelect}
          </div>
          <div>
            <h3 class="text-lg font-medium mb-2">禁用選項</h3>
            {disabledOptionSelect}
          </div>
          <div>
            <h3 class="text-lg font-medium mb-2">預設值</h3>
            {defaultValueSelect}
          </div>
          <div>
            <h3 class="text-lg font-medium mb-2">自定義 Store</h3>
            <div x-data>
              <Select state="mySelect" store="mySelects" placeholder="自定義狀態選擇框">
                <Option value="option1">選項 1</Option>
                <Option value="option2">選項 2</Option>
                <Option value="option3">選項 3</Option>
              </Select>
              <p class="mt-2 text-sm">當前值：<span x-text="$store.mySelects.mySelectSelectedValue || '未選擇'"></span></p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">所有變體（Variants）</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variantSelects.map(({ variant, select }) => (
            <div>
              <h3 class="text-sm font-medium mb-2">{variant}</h3>
              {select}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">顏色變化（Solid 變體）</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {colorSelects.map(({ color, select }) => (
            <div>
              <h3 class="text-sm font-medium mb-2">{color}</h3>
              {select}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-semibold mb-4">使用說明</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
            <li><strong>variant</strong>: 選擇框樣式變體</li>
            <li><strong>color</strong>: 顏色主題</li>
            <li><strong>value</strong>: 當前選擇的值</li>
            <li><strong>defaultValue</strong>: 預設值</li>
            <li><strong>state</strong>: Alpine.js Store 中的狀態鍵名（必填，每個 Select 需唯一）</li>
            <li><strong>store</strong>: Alpine.js Store 名稱（預設：selects）</li>
            <li><strong>disabled</strong>: 是否禁用整個選擇框</li>
            <li><strong>placeholder</strong>: 佔位符文字</li>
            <li><strong>showArrow</strong>: 是否顯示下拉箭頭</li>
            <li><strong>placement</strong>: 下拉選單位置（top/bottom）</li>
            <li><strong>maxHeight</strong>: 下拉選單最大高度</li>
            <li><strong>Option</strong>: 選項子組件，支援圖示和分隔線</li>
            <li><strong>Option value</strong>: 選項的值（必填）</li>
            <li><strong>Option disabled</strong>: 是否禁用此選項</li>
            <li><strong>Option divider</strong>: 是否為分隔線</li>
            <li>支援任意 Alpine.js x- 屬性</li>
          </ul>
          
          <div class="mt-4 p-3 bg-base-300 rounded">
            <h4 class="font-medium mb-2">使用範例：</h4>
            <pre class="text-xs bg-base-100 p-2 rounded">
{`<Select state="languageSelect" placeholder="選擇語言">
  <Option value="zh-tw">
    <Icon id="方塊:圖示:flag-tw" class="w-4 h-4 mr-2" />
    繁體中文
  </Option>
  <Option value="en">
    <Icon id="方塊:圖示:flag-us" class="w-4 h-4 mr-2" />
    English
  </Option>
</Select>`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}