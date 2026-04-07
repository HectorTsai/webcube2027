# UI Components

## 📁 目錄結構
```
components/
├── index.ts                 # createVariantComponent 工具函數
├── README.md               # 本文件
├── Button/                 # 按鈕組件
│   ├── index.tsx          # Props 介面定義
│   ├── solid.tsx          # solid variant
│   ├── outline.tsx        # outline variant
│   ├── ghost.tsx          # ghost variant
│   ├── dot.tsx            # dot variant
│   ├── dashed.tsx         # dashed variant
│   ├── double.tsx         # double variant
│   ├── glow.tsx           # glow variant
│   ├── gradient-right.tsx # gradient-right variant
│   ├── gradient-left.tsx  # gradient-left variant
│   ├── gradient-up.tsx    # gradient-up variant
│   ├── gradient-down.tsx  # gradient-down variant
│   ├── gradient-middle.tsx # gradient-middle variant
│   ├── gradient-diagonal.tsx # gradient-diagonal variant
│   ├── gradient-center.tsx  # gradient-center variant
│   ├── gradient-cone.tsx    # gradient-cone variant
│   ├── crystal.tsx         # crystal variant
│   ├── diagonal-stripes.tsx # diagonal-stripes variant
│   └── minimalist.tsx      # minimalist variant

## 🏗️ 組件架構

### Variant 模式
每個組件使用 variant 模式實現多種樣式變體：

1. **index.tsx** - 定義 Props 介面並導出組件
   - 使用 `createVariantComponent` 動態載入 variant
   - 定義 TypeScript 介面
   - 設定預設 variant

2. **variant 檔案** - 每個 variant 是獨立的 .tsx 檔案
   - 實現特定的樣式邏輯
   - 接收統一的 Props 介面
   - 使用 UnoCSS classes

### createVariantComponent
位於 `/components/index.ts` 的工具函數：

```typescript
export default function createVariantComponent(
  componentName: string,
  defaultVariant: string = "solid"
)
```

**功能**：
- 動態載入指定的 variant 檔案
- 如果載入失敗，自動回退到預設 variant
- 最終退回顯示錯誤訊息

## 🎯 開發新組件

### 步驟 1: 建立組件目錄
```bash
mkdir components/ComponentName
```

### 步驟 2: 建立 index.tsx
```tsx
import createVariantComponent from "../index.ts";

export interface ComponentNameProps {
  /** 子元素 */
  children: unknown;
  /** 樣式變體 */
  variant?: "variant1" | "variant2" | "variant3";
  /** 顏色主題 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  /** 尺寸 */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** 是否禁用 */
  disabled?: boolean;
  /** Alpine.js 點擊事件 */
  onClick?: string;
  /** 額外 CSS 類別 */
  className?: string;
}

export default createVariantComponent("ComponentName", "variant1");
```

### 步驟 3: 建立 variant 檔案
```tsx
import type { ComponentNameProps } from "./index.tsx";

export default function Variant1Component({
  children,
  color = "primary",
  size = "md",
  disabled = false,
  onClick,
  className
}: ComponentNameProps) {
  const sizeClasses = {
    xs: "text-xs px-2 py-1",
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
    xl: "text-xl px-8 py-4",
  };

  const finalClasses = [
    "base-class",
    `text-${color}`,
    sizeClasses[size],
    "transition-all duration-200"
  ];

  if (disabled) {
    finalClasses.push("opacity-50 cursor-not-allowed");
  }

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  const alpineProps: Record<string, string> = {};
  if (onClick) {
    alpineProps['@click'] = onClick;
  }

  return (
    <button
      class={classes}
      disabled={disabled}
      {...alpineProps}
    >
      {children}
    </button>
  );
}
```

## 🎨 UnoCSS 使用規範

### ✅ 推薦做法
- 使用 UnoCSS preset classes
- 使用 Tailwind CSS v4 語法
- 使用語意化顏色（`text-primary`, `bg-secondary`）
- 使用狀態變化（`hover:bg-primary`, `focus:ring-2`）
- 使用響應式類別（`md:grid-cols-2`, `lg:grid-cols-3`）

### ❌ 禁止事項
- 不使用 `<script>` 標籤
- 不使用 inline event handlers（`onclick`, `onmouseover`）
- 不使用 arbitrary values（`text-[#ff0000]`, `p-[16px]`）
- 不使用 JavaScript 表達式作為 class

### 🎯 UnoCSS API
```tsx
// 取得可用的 classes
const response = await fetch('/api/v1/styles/available');
const { data } = await response.json();
const { classes, colors, components, themeVariables } = data;
```

## ⚡ Alpine.js 支援

內建組件支援使用 Alpine.js 與客戶端互動。

### 使用方式
```tsx
// onClick 事件
<Button onClick="alert('點擊!')">點擊我</Button>

// Alpine.js 指令
<div x-data="{ count: 0 }">
  <button @click="count++">計數: <span x-text="count"></span></button>
</div>
```

### 可用的 Alpine.js 屬性
- `@click` - 點擊事件
- `@submit` - 表單提交事件
- `@input` - 輸入事件
- `@change` - 改變事件
- `x-data` - 組件數據
- `x-text` - 文本綁定
- `x-html` - HTML 綁定
- `x-show` - 顯示/隱藏
- `x-if` - 條件渲染
- `x-for` - 列表渲染

注意：具體可用的 Alpine.js 指令取決於專案中載入的 Alpine.js 版本和配置。

## 📋 Button 組件範例

### Props 介面
```typescript
export interface ButtonProps {
  children: unknown;
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: string;
  className?: string;
}
```

### 使用範例
```tsx
import Button from "../components/Button/index.tsx";

// 基礎使用
<Button>按鈕</Button>

// 指定 variant 和 color
<Button variant="outline" color="primary">外框按鈕</Button>

// 指定尺寸
<Button size="lg">大按鈕</Button>

// Alpine.js 事件
<Button onClick="alert('點擊!')">點擊我</Button>

// 禁用狀態
<Button disabled>禁用按鈕</Button>
```

## 🔄 匯入規則
```tsx
// ✅ 正確的匯入方式（兩種都可以）
import Button from "../components/Button";
import Button from "../components/Button/index.tsx";
import Card from "../components/Card";
import Input from "../components/Input";

// ❌ 錯誤的匯入方式
import { Button } from "../components/Button";
```

## 📝 命名規則
- **組件目錄**：使用 PascalCase（`Button`, `Card`, `Input`）
- **variant 檔案**：使用 kebab-case（`solid.tsx`, `gradient-left.tsx`）
- **Props 介面**：使用 PascalCase + Props（`ButtonProps`, `CardProps`）
- **variant 函數**：使用 PascalCase + Variant（`SolidButton`, `OutlineButton`）

## 🚨 注意事項
1. 所有 variant 必須導出 default function
2. 所有 variant 必須接收相同的 Props 介面
3. 使用 `jsx` 或直接返回 JSX 元素
4. 支援 Alpine.js 事件使用 `@click` 語法
5. 使用 UnoCSS classes 進行樣式設計
6. 保持程式碼一致性，遵循既有的 variant 結構
