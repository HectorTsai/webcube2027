# WebCube2027

一個基於 **Deno + Hono + UnoCSS** 的現代化網頁框架，採用 **Hono 原生 JSX 渲染機制**，支援檔案路由、多語言、動態佈局系統。

## 🚀 快速開始

```bash
deno task start
```

## 🔥 核心特色

### � Hono 原生 JSX 渲染
- **零序列化器**：使用 Hono 內建的 JSX 渲染引擎
- **非同步組件支援**：完整支援 `async` 組件
- **串流渲染**：支援 Hono 的串流 JSX 渲染
- **類型安全**：完整的 TypeScript 支援

### ⚡ 高效能路由系統
- **零 IO 請求處理**：模組預載入到內存
- **嵌套佈局**：支援多層佈局包裝
- **嵌套中間件**：支援路徑層級的中間件
- **內部重導向**：高效能的內部重導向機制

### 🎨 動態佈局系統

WebCube2027 支援模組化的佈局系統，讓您可以輕鬆切換不同的頁面佈局風格。

### 📁 佈局架構

```
src/components/
├── 佈局.tsx          # 統一佈局入口
└── 佈局/             # 佈局元件目錄
    ├── 經典.tsx      # 經典佈局 (header + main + footer)
    ├── 簡約.tsx      # 簡約佈局 (只有內容區域)
    └── 居中.tsx      # 居中佈局 (內容置中顯示)
```

### 🎯 使用方式

1. **設定佈局風格** - 在資料庫的 `骨架.佈局` 欄位設定風格名稱
2. **可用風格** - `"經典"`、`"簡約"`、`"居中"` (也支援英文：`"classic"`、`"minimal"`、`"centered"`)
3. **預設值** - 空值或新資料會自動使用 `"經典"` 佈局

### 🎨 風格元件系統

```
src/components/
├── 實心/             # 實心風格元件
├── 線框/             # 線框風格元件
├── 幽靈/             # 幽靈風格元件
└── 頁尾.tsx          # 動態頁尾系統
```

## 📁 檔案路由結構

```
src/routes/
├── _app.tsx          # 最外層：HTML 結構
├── _layout.tsx       # 第二層：全域佈局
├── _middleware.tsx   # 全域中間件
├── _404.tsx          # 404 錯誤頁面
├── _error.tsx        # 錯誤處理器
├── _500.tsx          # 500 伺服器錯誤
├── index.tsx         # 首頁 (/)
├── about.tsx         # 關於頁面 (/about)
├── users/
│   ├── [id].tsx      # 動態路由 (/users/:id)
│   └── _layout.tsx   # 用戶頁面佈局
└── blog/
    ├── index.tsx     # Blog 首頁 (/blog)
    └── _layout.tsx   # Blog 佈局
```

## 🛠 技術棧

- **🦕 Deno** - 現代化 JavaScript/TypeScript 運行時
- **⚡ Hono** - 超快速的 Web 框架
- **🎨 UnoCSS** - 原子化 CSS 引擎
- **🗄️ SurrealDB** - 現代化資料庫
- **🌐 多國語言** - @dui/smartmultilingual 整合

## 🚀 效能特色

### ⚡ 零 IO 路由處理
```typescript
// 啟動時預載入所有模組
const module = await import(`file://${absolutePath}`)
this.routes.set(urlPath, { handler: module.default })

// 請求時直接從內存讀取
const route = this.routes.get(path)
const content = await route.handler(ctx)
```

### 🔄 內部重導向
```typescript
// 高效能內部重導向，避免重新 request
if (!user) {
  return await ctx.internalRedirect('/login')
}
```

### 🛡️ 安全機制
- **循環檢測**：自動檢測重導向循環
- **次數限制**：防止超過 5 次的重導向鏈
- **自動降級**：循環或超限時降級為標準 302

## 📚 文件

詳細文件請參考 [docs/](./docs/) 目錄：

- [📋 規劃書.md](./docs/規劃書.md) - 專案總覽和開發里程碑
- [🔧 路由器.md](./docs/路由器.md) - 檔案路由器詳細設計
- [🗄️ 資料庫.md](./docs/資料庫.md) - KV + SurrealDB 混合架構
- [🎨 佈景主題.md](./docs/佈景主題.md) - AI 驅動的佈景主題系統
- [📸 媒體庫.md](./docs/媒體庫.md) - MinIO 媒體處理系統
- [🌐 多國語言.md](./docs/多國語言.md) - 多國語言系統

## 🎉 框架級特性

WebCube2027 具備**框架級**的完整功能：

✅ **非同步渲染** (Async Components)
✅ **嵌套佈局** (Nested Layouts)  
✅ **嵌套中間件** (Nested Middleware)
✅ **內部高效重導向** (Internal Redirect)
✅ **零 IO 高併發** (Zero IO High Concurrency)
✅ **Hono 原生 JSX** (Hono Native JSX)
✅ **路徑正規化** (Path Normalization)
✅ **類型安全** (Type Safety)
✅ **生產就緒** (Production Ready)

## 📄 授權

MIT License

### 📡 API 端點

#### 取得可用佈局清單
```bash
GET /api/layouts
```

**回應範例：**
```json
{
  "成功": true,
  "佈局": ["經典", "簡約", "居中"],
  "數量": 3,
  "說明": "可用的佈局風格"
}
```

### 🔧 新增佈局

1. 在 `src/components/佈局/` 目錄新增佈局檔案 (例如：`新佈局.tsx`)
2. 在 `src/components/佈局.tsx` 中匯入並加入對應表
3. 重新啟動伺服器，新佈局會自動出現在 `/api/layouts` API 中

### 🎨 佈局範例

**經典佈局** - 完整的頁面結構，包含導航、內容和頁尾

**簡約佈局** - 極簡設計，只有內容區域

**居中佈局** - 內容置中顯示，適合登入頁面或單一焦點頁面

## 🌟 特色功能

- 📦 **模組化設計** - 每個佈局都是獨立元件
- 🔄 **動態切換** - 透過資料庫設定即可切換佈局
- 🛡️ **穩定可靠** - 靜態匯入，無執行時錯誤
- 📱 **響應式設計** - 支援各種螢幕尺寸
- 🎯 **易於擴展** - 新增佈局只需幾個步驟

## 📋 技術棧

- **Deno** - 現代化 JavaScript/TypeScript 執行環境
- **Hono** - 輕量級 Web 框架
- **UnoCSS** - 原子化 CSS 框架
- **SurrealDB** - 現代化資料庫
- **TypeScript** - 型別安全的 JavaScript

## 🚀 開發指令

```bash
# 啟動開發伺服器
deno task start

# 編譯 UnoCSS
deno task uno

# 監看 UnoCSS 變化
deno task uno:watch

# 開發模式 (同時監看 UnoCSS)
deno task dev
```
