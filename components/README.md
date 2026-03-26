# UI Components

## 📁 目錄結構
- `layouts/` - 佈局組件（全局結構，接收 children）
- `ui/` - 基礎 UI 組件（原子級，可重用）
- `container/` - 容器類方塊（純佈局輔助）
- `content/` - 內容展示方塊（有業務意義）
- `navigation/` - 導航相關方塊
- `forms/` - 表單相關方塊

## 🎯 AI 開發指南

### 佈局組件 (layouts/)
- **必須接收 `children` prop**
- **定義全局結構**（Header, Main, Footer）
- **使用 Container 組件**
- **範例**：
```tsx
export default function ClassicLayout({ children }) {
  return (
    <Container direction="column" width="full">
      <MainMenu />
      <Container padding="lg">
        {children}
      </Container>
      <Footer />
    </Container>
  );
}
```

### 基礎 UI 組件 (ui/)
- **使用 TypeScript 介面**
- **支援多種 variant**
- **遵循 UnoCSS classes**
- **範例**：
```tsx
// Button 使用 children，支援彈性內容
<Button>
  <Icon name="save" />
  <span>儲存</span>
</Button>
```

## 🚨 禁止事項
- ❌ 不使用 `<script>` 標籤
- ❌ 不使用 inline event handlers
- ❌ 不使用 arbitrary values (`text-[#ff0000]`)
- ✅ 使用 UnoCSS preset classes
- ✅ 支援 Tailwind CSS v4 語法

## 🎨 UnoCSS API 使用

### 取得可用的 CSS Classes
```tsx
// 從 API 取得最新的 UnoCSS preset 列表
const response = await fetch('/api/styles/available');
const { classes, colors, spacing, typography } = await response.json();

// 使用可用的 classes
<div className={classes.container}>
  <h1 className={typography.h1}>標題</h1>
  <button className={`${colors.primary} ${spacing.padding.lg}`}>
    按鈕
  </button>
</div>
```

### AI 開發時的 CSS Classes 規範
```tsx
// ✅ 正確 - 使用 UnoCSS preset classes 或 Tailwind CSS v4 語法
<div className="container mx-auto p-4">
  <h1 className="text-2xl font-bold text-primary">標題</h1>
  <button className="btn btn-primary hover:bg-primary-dark">
    按鈕
  </button>
</div>

// ✅ 正確 - Tailwind CSS v4 語法
<div className="grid grid-cols-3 gap-4">
  <Card className="col-span-2">
    <h2 className="text-xl font-semibold">卡片標題</h2>
  </Card>
  <div className="space-y-2">
    <Button size="sm">小按鈕</Button>
    <Button variant="outline">外框按鈕</Button>
  </div>
</div>

// ❌ 錯誤 - 使用 arbitrary values
<div className="container mx-auto p-[16px]">
  <h1 className="text-[24px] font-bold text-[#3b82f6]">標題</h1>
</div>
```

### Tailwind CSS v4 支援
- ✅ **標準語法** - `grid`, `flex`, `space-y-2`, `gap-4`
- ✅ **響應式** - `md:grid-cols-2`, `lg:grid-cols-3`
- ✅ **狀態變化** - `hover:bg-primary-dark`, `focus:ring-2`
- ✅ **組合類別** - `inline-flex items-center justify-center`
- ✅ **語意化顏色** - `text-primary`, `bg-secondary`

### API 回應格式
```json
{
  "success": true,
  "data": {
    "classes": {
      "container": "container mx-auto",
      "btn": "btn",
      "btn-primary": "btn-primary bg-blue-500 hover:bg-blue-600"
    },
    "colors": {
      "primary": "text-blue-500",
      "secondary": "text-gray-500"
    },
    "spacing": {
      "padding": {
        "sm": "p-2",
        "md": "p-4",
        "lg": "p-6"
      }
    },
    "typography": {
      "h1": "text-4xl font-bold",
      "h2": "text-3xl font-bold"
    }
  }
}
```

## 📚 可用組件
- `Container` - 佈局容器
- `Button` - 按鈕
- `Icon` - 小型圖示 (SVG/PNG/ICO)
- `Image` - 大型圖片 (支援多種格式)
- `Input` - 輸入框
- `Card` - 卡片

## 🔄 匯入規則
```tsx
// 正確的匯入方式
import Container from "../container/Container.tsx";
import Button from "../ui/Button.tsx";
import Icon from "../ui/Icon.tsx";
import Image from "../ui/Image.tsx";
import ClassicLayout from "../layouts/ClassicLayout.tsx";
```
