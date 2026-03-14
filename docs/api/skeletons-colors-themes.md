# 骨架、配色、佈景主題 API 文件

## 📋 概述

這組 API 提供網站設計系統的核心資源，包括骨架（佈局結構）、配色（色彩方案）和佈景主題（完整設計組合）。所有 API 都採用三層查詢架構和優雅的錯誤處理機制。

## 🏗️ 架構設計

### 三層查詢架構
1. **第一層**：直接查詢指定資源
2. **第二層**：從佈景主題查找相關資源
3. **第三層**：使用預設值

### 錯誤處理機制
- 🔄 **永遠成功**：所有 API 都回傳 `成功: true`
- 📦 **預設值回退**：發生錯誤時回傳預設資料
- 📝 **Console 記錄**：錯誤詳細記錄在 console
- 🎯 **來源標記**：清楚標示資料來源

---

## 🗂️ 骨架 API

### 取得所有骨架
```http
GET /api/skeletons
```

#### 回應格式
```json
{
  "成功": true,
  "骨架列表": [
    {
      "id": "骨架:骨架:AIVMu8UoQjw1",
      "名稱": {},
      "描述": {},
      "佈局": "方塊:方塊:cube-網站-經典",
      "風格": "實心",
      "圖示": "外框",
      "書本樣式": "經典",
      "開始動畫": "Buildings",
      "載入器": "loading-dot",
      "圓角": {
        "中": "0.5rem",
        "大": "1rem", 
        "小": "1.9rem"
      },
      "動畫": {
        "下拉選單.開": "animate__fadeIn",
        "下拉選單.關": "animate__fadeOut",
        "抽屜.開": "animate__fadeIn",
        "抽屜.關": "animate__fadeOut",
        "視窗.開": "animate__fadeIn",
        "視窗.關": "animate__fadeOut"
      },
      "來源": "預設"
    }
  ],
  "總數": 1,
  "說明": "使用預設骨架（系統資料庫未連線或無資料）"
}
```

### 取得特定骨架
```http
GET /api/skeletons/{id}
```

#### 回應格式
```json
{
  "成功": true,
  "骨架": {
    "id": "骨架:骨架:AIVMu8UoQjw1",
    "名稱": {},
    "描述": {},
    "佈局": "方塊:方塊:cube-網站-經典",
    "風格": "實心",
    "圖示": "外框",
    "書本樣式": "經典",
    "開始動畫": "Buildings",
    "載入器": "loading-dot",
    "圓角": {
      "中": "0.5rem",
      "大": "1rem",
      "小": "1.9rem"
    },
    "動畫": {
      "下拉選單.開": "animate__fadeIn",
      "下拉選單.關": "animate__fadeOut",
      "抽屜.開": "animate__fadeIn",
      "抽屜.關": "animate__fadeOut",
      "視窗.開": "animate__fadeIn",
      "視窗.關": "animate__fadeOut"
    },
    "來源": "預設"
  }
}
```

---

## 🎨 配色 API

### 取得所有配色
```http
GET /api/colors
```

#### 回應格式
```json
{
  "成功": true,
  "配色列表": [
    {
      "id": "配色:配色:_dIZJFy3cbbp",
      "名稱": {},
      "描述": {},
      "主色": "59.67% 0.221 258.03",
      "次色": "39.24% 0.128 255",
      "強調色": "77.86% 0.1489 226.0173",
      "中性色": "35.5192% .032071 262.988584",
      "背景1": "100% 0 0",
      "背景2": "93% 0 0",
      "背景3": "88% 0 0",
      "背景內容": "35.5192% .032071 262.988584",
      "資訊色": "71.17% 0.166 241.15",
      "成功色": "60.9% 0.135 161.2",
      "警告色": "73% 0.19 52",
      "錯誤色": "57.3% 0.234 28.28",
      "來源": "預設"
    }
  ],
  "總數": 1,
  "說明": "使用預設配色（系統資料庫未連線或無資料）"
}
```

### 取得特定配色
```http
GET /api/colors/{id}
```

#### 回應格式
```json
{
  "成功": true,
  "配色": {
    "id": "配色:配色:_dIZJFy3cbbp",
    "名稱": {},
    "描述": {},
    "主色": "59.67% 0.221 258.03",
    "次色": "39.24% 0.128 255",
    "強調色": "77.86% 0.1489 226.0173",
    "中性色": "35.5192% .032071 262.988584",
    "背景1": "100% 0 0",
    "背景2": "93% 0 0",
    "背景3": "88% 0 0",
    "背景內容": "35.5192% .032071 262.988584",
    "資訊色": "71.17% 0.166 241.15",
    "成功色": "60.9% 0.135 161.2",
    "警告色": "73% 0.19 52",
    "錯誤色": "57.3% 0.234 28.28",
    "來源": "預設"
  },
  "CSS變數": {
    "--p": "59.67% 0.221 258.03",
    "--pc": "59.67% 0.221 258.03c",
    "--p-hover": "59.67% 0.221 258.03-hover",
    "--p-active": "59.67% 0.221 258.03-active",
    "--s": "39.24% 0.128 255",
    "--sc": "39.24% 0.128 255c",
    "--s-hover": "39.24% 0.128 255-hover",
    "--s-active": "39.24% 0.128 255-active",
    "--a": "77.86% 0.1489 226.0173",
    "--ac": "77.86% 0.1489 226.0173c",
    "--a-hover": "77.86% 0.1489 226.0173-hover",
    "--a-active": "77.86% 0.1489 226.0173-active",
    "--b1": "100% 0 0",
    "--b2": "93% 0 0",
    "--b3": "88% 0 0",
    "--bc": "35.5192% .032071 262.988584",
    "--success": "60.9% 0.135 161.2",
    "--warning": "73% 0.19 52",
    "--error": "57.3% 0.234 28.28",
    "--info": "71.17% 0.166 241.15"
  }
}
```

---

## 🎭 佈景主題 API

### 取得所有佈景主題
```http
GET /api/themes
```

#### 回應格式
```json
{
  "成功": true,
  "佈景主題列表": [
    {
      "id": "佈景主題:預設:經典",
      "名稱": {
        "en": "Classic Theme",
        "zh-tw": "經典佈景主題",
        "vi": "Chủ đề Cổ điển"
      },
      "描述": {
        "en": "Classic theme with traditional layout and blue color scheme",
        "zh-tw": "經典佈景主題，傳統佈局搭配藍色配色",
        "vi": "Chủ đề cổ điển với bố cục truyền thống và màu xanh"
      },
      "骨架": "骨架:骨架:經典",
      "配色": "配色:配色:經典藍",
      "版本": "1.0.0",
      "狀態": "啟用",
      "來源": "預設"
    }
  ],
  "總數": 1,
  "說明": "使用預設佈景主題（系統資料庫未連線或無資料）"
}
```

### 取得特定佈景主題
```http
GET /api/themes/{id}
```

#### 回應格式
```json
{
  "成功": true,
  "佈景主題": {
    "id": "佈景主題:預設:經典",
    "名稱": {
      "en": "Classic Theme",
      "zh-tw": "經典佈景主題",
      "vi": "Chủ đề Cổ điển"
    },
    "描述": {
      "en": "Classic theme with traditional layout and blue color scheme",
      "zh-tw": "經典佈景主題，傳統佈局搭配藍色配色",
      "vi": "Chủ đề cổ điển với bố cục truyền thống và màu xanh"
    },
    "骨架": "骨架:骨架:經典",
    "配色": "配色:配色:經典藍",
    "版本": "1.0.0",
    "狀態": "啟用",
    "來源": "預設"
  },
  "骨架": {
    "id": "骨架:骨架:AIVMu8UoQjw1",
    "名稱": {},
    "描述": {},
    "佈局": "方塊:方塊:cube-網站-經典",
    "風格": "實心",
    "圖示": "外框",
    "書本樣式": "經典",
    "來源": "預設"
  },
  "配色": {
    "id": "配色:配色:_dIZJFy3cbbp",
    "名稱": {},
    "描述": {},
    "主色": "59.67% 0.221 258.03",
    "次色": "39.24% 0.128 255",
    "強調色": "77.86% 0.1489 226.0173",
    "來源": "預設"
  }
}
```

---

## 🎨 樣式資源 API

### 取得可用樣式資源
```http
GET /api/styles/available
```

#### 回應格式
```json
{
  "成功": true,
  "樣式資源": {
    "css_variables": {
      "顏色": {
        "primary": ["--p", "--pc", "--p-hover", "--p-active"],
        "secondary": ["--s", "--sc", "--s-hover", "--s-active"],
        "accent": ["--a", "--ac", "--a-hover", "--a-active"],
        "surface": ["--b1", "--b2", "--b3", "--bc", "--bc-muted"],
        "semantic": ["--success", "--warning", "--error", "--info"]
      },
      "間距": ["--spacing-xs", "--spacing-sm", "--spacing-md", "--spacing-lg", "--spacing-xl"],
      "字體": ["--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl", "--text-2xl", "--text-3xl"],
      "圓角": ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-field", "--radius-box"],
      "陰影": ["--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl"],
      "容器": ["--container-sm", "--container-md", "--container-lg", "--container-xl", "--container-2xl", "--container-4xl"]
    },
    "emotion_patterns": {
      "layout": ["display: flex", "display: grid", "flex-direction: row|column"],
      "sizing": ["width: 100%", "height: 100%", "max-width: var(--container-sm|md|lg|xl|2xl|4xl)"],
      "spacing": ["padding: var(--spacing-sm|md|lg|xl)", "margin: var(--spacing-sm|md|lg|xl)"],
      "visual": ["background-color: var(--color)", "border: 1px solid var(--border)"],
      "typography": ["font-size: var(--text-sm|md|lg|xl)", "font-weight: 400|500|600|700"],
      "animation": ["transition: all 0.2s ease", "transform: translateY(-2px)"]
    },
    "design_tokens": {
      "spacing": {
        "xs": "0.25rem",
        "sm": "0.5rem",
        "md": "1rem",
        "lg": "1.5rem",
        "xl": "2rem"
      },
      "typography": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem"
      },
      "borderRadius": {
        "sm": "0.125rem",
        "md": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "field": "0.375rem",
        "box": "0.5rem"
      },
      "shadow": {
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1)"
      }
    },
    "breakpoints": {
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1280px",
      "2xl": "1536px",
      "4xl": "2560px"
    }
  },
  "版本": "1.0.0",
  "說明": "從設計系統取得樣式資源"
}
```

---

## 🔧 技術實作

### 檔案結構
```
src/routes/api/
├── skeletons/
│   ├── index.ts          # 取得所有骨架
│   └── [id].ts           # 取得特定骨架
├── colors/
│   ├── index.ts          # 取得所有配色
│   └── [id].ts           # 取得特定配色
├── themes/
│   ├── index.ts          # 取得所有佈景主題
│   └── [id].ts           # 取得特定佈景主題
└── styles/
    └── available.ts      # 取得樣式資源
```

### 關鍵特性
- ✅ **File Router 模式**：使用 `export default async function`
- ✅ **三層查詢架構**：智能資源查找
- ✅ **優雅錯誤處理**：永遠回傳預設值
- ✅ **統一回應格式**：一致的 JSON 結構
- ✅ **來源標記**：清楚標示資料來源
- ✅ **多國語言支援**：使用 MultilingualString

### 資料庫依賴
- 🗄️ **系統資料庫**：儲存骨架、配色、佈景主題
- 🌐 **KV 資料庫**：儲存方塊（不使用於此 API）
- 🔄 **Middleware**：提供資料庫連線和語言設定

---

## 🚀 使用範例

### 基本查詢
```javascript
// 取得所有可用骨架
const skeletons = await fetch('/api/skeletons').then(r => r.json())

// 取得特定配色
const color = await fetch('/api/colors/配色:配色:經典藍').then(r => r.json())

// 取得樣式資源
const styles = await fetch('/api/styles/available').then(r => r.json())
```

### AI 整合範例
```javascript
// AI 選擇設計組合
async function selectDesign() {
  const [skeletons, colors, themes] = await Promise.all([
    fetch('/api/skeletons').then(r => r.json()),
    fetch('/api/colors').then(r => r.json()),
    fetch('/api/themes').then(r => r.json())
  ])

  // AI 可以根據需求選擇最適合的組合
  return {
    skeleton: skeletons.骨架列表[0],
    color: colors.配色列表[0],
    theme: themes.佈景主題列表[0]
  }
}
```

---

## 📊 狀態說明

### 來源標記
- `"預設"`：使用模型預設值
- `"系統資料庫"`：從系統資料庫取得
- `"佈景主題"`：從佈景主題關聯取得
- `"骨架關聯"`：從骨架反向查找佈景主題
- `"配色關聯"`：從配色反向查找佈景主題

### 系統狀態
- 🔄 **系統資料庫未初始化**：所有 API 回傳預設值
- 📊 **系統資料庫已初始化**：API 優先使用資料庫資料
- 🎯 **混合狀態**：部分資料來自資料庫，部分來自預設值

---

## 🎯 最佳實踐

### 開發建議
1. **檢查來源標記**：判斷資料來源
2. **處理多國語言**：使用 `名稱.zh-tw` 等欄位
3. **使用 CSS 變數**：配色 API 提供 CSS 變數對應
4. **錯誤處理**：API 永遠成功，不需要額外錯誤處理
5. **快取策略**：可以快取 API 回應提升效能

### AI 整合建議
1. **優先使用佈景主題**：包含完整設計組合
2. **靈活組合**：可以獨立選擇骨架和配色
3. **樣式資源**：使用 DesignSystem 提供的樣式資源
4. **一致性**：確保生成的樣式符合設計規範
