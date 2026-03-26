# 基礎 UI 組件

## 🎯 職責範圍
- 原子級可重用組件
- 純展示，無業務邏輯
- 支援多種樣式變體

## 📋 可用組件類型
- **按鈕** (Button) - 各種樣式和大小
- **圖示** (Icon) - 小型圖示，支援 SVG/PNG/ICO
- **圖片** (Image) - 大型圖片，支援多種格式
- **卡片** (Card) - 內容容器
- **標題** (Heading) - H1-H6 標題

## 🎨 樣式規範
- 使用 UnoCSS classes
- 支援 variant props
- 響應式設計
- 一致的顏色系統

## � 使用規範

### Icon 組件
- **用途**：小圖示、按鈕圖示、導航圖示
- **尺寸**：xs(16px), sm(24px), md(32px), lg(48px)
- **格式**：SVG, PNG, ICO
- **載入方式**：資料庫 ID、直接路徑、SVG 字串

```tsx
// 資料庫圖示
<Icon id="圖示:圖示:heart" size="md" color="red" />

// 直接檔案
<Icon src="/icons/save.png" size="sm" />

// AI 生成 SVG
<Icon svg="<path d='...'/>" size="lg" />
```

### Image 組件
- **用途**：橫幅、照片、插畫、大型圖片
- **尺寸**：無限制，但建議 > 100px
- **格式**：JPG, PNG, GIF, WebP, SVG
- **特色**：懶載入、錯誤回退、響應式

```tsx
// 橫幅圖片
<Image 
  src="/images/banner.jpg" 
  alt="公司橫幅"
  width="1200" 
  height="400"
  loading="eager"
/>

// 內容圖片
<Image 
  src="/images/product.jpg" 
  alt="產品照片"
  width="800" 
  height="600"
  fallback="/images/placeholder.jpg"
/>
```

## �📝 範例模板

### Button 組件
```tsx
interface ButtonProps {
  children: any;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

// Button 使用 children，支援彈性內容
<Button>
  <Icon name="save" />
  <span>儲存</span>
</Button>
```

### Icon 組件
```tsx
interface IconProps {
  id?: string;
  src?: string;
  svg?: string;
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

// AI 生成的 SVG 圖示
<Icon 
  svg="<path d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/>"
  size="md" 
  color="primary" 
/>
```

### Image 組件
```tsx
interface ImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  loading?: "lazy" | "eager";
  fallback?: string;
}

// 響應式圖片
<Image 
  src="/images/hero.jpg" 
  alt="主題圖片"
  width="1200"
  height="600"
  loading="lazy"
  className="rounded-lg shadow-md"
/>
```

## 🎨 最佳實踐
```tsx
// ✅ 推薦
<Button><Icon size="sm" />儲存</Button>
<div className="hero"><Image width="1200" height="400" /></div>

// ⚠️ 不推薦（但不會報錯）
<Image width="16" height="16" />  // 小圖用 Image，可能變醜
<Icon size="lg" />               // 大圖用 Icon，可能模糊
```

## 🚨 重要規則
- **保持簡單** - 專注於單一功能
- **TypeScript 優先** - 完整型別定義
- **無狀態** - 不管理內部狀態
- **可測試** - 容易單元測試
- **可訪問性** - Image 必須有 alt 文字

## 🎨 UnoCSS API 使用

### 取得可用的 CSS Classes
```tsx
// AI 生成組件時，先取得可用的 classes
const styles = await fetch('/api/styles/available').then(r => r.json());

// 使用正確的 preset classes
const buttonClasses = `${styles.classes.btn} ${styles.classes.btnPrimary}`;
const iconSizes = styles.spacing.sizing; // xs, sm, md, lg
```

### UI 組件的 CSS 規範
```tsx
// ✅ 正確 - 使用 API 取得的 classes
<button className="btn btn-primary text-sm">
  <Icon className="w-4 h-4" />
  <span className="ml-2">按鈕文字</span>
</button>

// ❌ 錯誤 - 使用 arbitrary values
<button className="btn btn-primary text-[14px]">
  <Icon className="w-[16px] h-[16px]" />
  <span className="ml-[8px]">按鈕文字</span>
</button>
```

### 可用的 UI 相關 Classes
```json
{
  "classes": {
    "btn": "btn inline-flex items-center justify-center",
    "btnPrimary": "bg-blue-500 hover:bg-blue-600 text-white",
    "btnSecondary": "bg-gray-500 hover:bg-gray-600 text-white",
    "card": "card bg-white rounded-lg shadow-md",
    "input": "input border border-gray-300 rounded px-3 py-2"
  },
  "spacing": {
    "sizing": {
      "xs": "w-4 h-4",
      "sm": "w-6 h-6", 
      "md": "w-8 h-8",
      "lg": "w-12 h-12"
    }
  }
}
```

## 📦 相依組件
- 無外部相依，保持獨立
