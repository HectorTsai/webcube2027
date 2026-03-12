# WebCube2027 路由器文件

## 📋 概述

WebCube2027 使用自定義的檔案路由器，支援動態路由參數提取和 Hono 框架整合。

## 🎯 路由結構

### 基本路由規則

```
src/routes/
├── index.tsx              → /
├── about.tsx              → /about
├── users/
│   ├── [username].tsx     → /users/:username
│   └── profile.tsx        → /users/profile
├── api/
│   ├── components/
│   │   ├── index.tsx      → /api/components
│   │   ├── [style].tsx    → /api/components/:style
│   │   └── [style]/
│   │       ├── [id].tsx  → /api/components/:style/:id
│   │       └── index.tsx → /api/components/:style (優先權更高)
│   └── layouts.tsx        → /api/layouts
└── blog/
    ├── index.tsx          → /blog
    └── posts/
        └── [slug].tsx     → /blog/posts/:slug
```

## 🔄 動態路由參數

### 參數提取方式

在路由元件中，可以使用以下方式獲取參數：

```typescript
export default function MyPage(ctx: Context) {
  // 方式 A: Hono 原生風格 (推薦)
  const username = ctx.req.param('username')
  
  // 方式 B: 狀態機風格 (穩定)
  const params = ctx.get('params') as Record<string, string>
  const username = params['username']
  
  return <div>使用者：{username}</div>
}
```

### 支援的參數類型

✅ **完全支援：**
- 英文數字：`demo`, `user123`
- 中文：`測試`, `使用者`
- URL 編碼：`%E6%B8%AC%E8%A9%A6` (測試)
- 空格編碼：`hello%20world` (hello world)
- 特殊字符：`@#$%^&*`

## 🎯 路由優先權

### 重要規則

**🚫 不要混用相同路徑：**

❌ **錯誤做法：**
```
src/routes/api/components/[style].tsx     ← 較低優先權
src/routes/api/components/[style]/index.tsx ← 較高優先權
```

✅ **正確做法：**
```
src/routes/api/components/[style].tsx     ← 使用這個
src/routes/api/components/[style]/[id].tsx ← 具體元件
```

### 優先權順序

1. **📁 目錄結構** - `[style]/index.tsx` (最高)
2. **📄 檔案結構** - `[style].tsx` (較低)
3. **🎯 只會選擇一個** - 路由器不會同時處理兩者

## 🔧 技術實作

### 核心代碼

路由器的參數提取邏輯很簡潔：

```typescript
// 在 router.ts 的 wrapComponent 中
if (route) {
  const params = this.extractRouteParams(path, route.path)
  
  // 將參數存入 ctx 狀態機
  ctx.set('params', params);
  
  // 覆蓋 ctx.req.param 方法
  ctx.req.param = (name?: string) => {
    if (name) {
      return params[name] || undefined
    }
    return params as any
  };
}
```

### 正則表達式處理

```typescript
// 處理結尾斜線
const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');

// 動態路由匹配
const regex = new RegExp('^' + pattern.replace(/:[^\/]+/g, '([^/]+)') + '/?$')
```

## 🚀 使用範例

### 基本動態路由

```typescript
// src/routes/users/[username].tsx
export default function 使用者頁面(ctx: Context) {
  const username = ctx.req.param('username')
  
  return (
    <div>
      <h1>使用者：{username}</h1>
      <p>這是 {username} 的個人頁面</p>
    </div>
  )
}
```

### 多層參數路由

```typescript
// src/routes/api/components/[style]/[id].tsx
export default async function 元件API(ctx: Context) {
  const style = ctx.req.param('style')
  const id = ctx.req.param('id')
  
  return ctx.json({
    風格: style,
    元件ID: id,
    內容: `這是 ${style} 風格的 ${id} 元件`
  })
}
```

## 📱 API 設計模式

### 三層 API 架構

```
/api/components                    → 列出所有風格
/api/components/:style             → 風格詳細資訊
/api/components/:style/:id         → 具體元件內容
```

### 風格映射

```typescript
const styleMap: Record<string, string> = {
  'solid': '實心',
  'ghost': '幽靈', 
  'outline': '線框'
}
```

## 🔍 除錯技巧

### 檢查路由註冊

訪問 `http://localhost:8000/_routes` 查看所有註冊的路由：

```json
{
  "routes": [
    {
      "path": "/users/:username",
      "filePath": "src/routes/users/[username].tsx",
      "params": ["username"]
    }
  ]
}
```

### 參數調試

```typescript
export default function DebugPage(ctx: Context) {
  const username = ctx.req.param('username')
  const params = ctx.get('params') as Record<string, string>
  
  console.log('參數提取:', { username, params })
  
  return <div>參數：{username}</div>
}
```

## ⚠️ 注意事項

### 服務重啟

🔄 **路由器只在啟動時掃描檔案**
- 新增路由檔案需要重啟服務
- 修改路由檔案建議重啟服務
- 開發時可以使用熱重載

### 編碼處理

✅ **Hono 自動處理 URL 編碼**
- 不需要手動解碼
- 支援所有字符集
- SEO 友好

### 性能考量

📡 **路由匹配效率**
- 精確匹配優先於動態匹配
- 正則表達式緩存
- 參數提取一次完成

## 🎯 最佳實踐

### 檔案命名

✅ **推薦：**
- 使用英文參數名稱：`[id]`, `[slug]`, `[username]`
- 保持檔案結構簡潔
- 避免過深的巢狀

❌ **避免：**
- 混用檔案和目錄結構
- 使用特殊字符在檔名中
- 過度複雜的路由結構

### 參數處理

✅ **推薦：**
```typescript
// 使用 ctx.req.param (Hono 原生)
const id = ctx.req.param('id')

// 或使用 ctx.get('params') (穩定)
const params = ctx.get('params') as Record<string, string>
const id = params['id']
```

❌ **避免：**
```typescript
// 不要依賴實驗性方法
const id = (ctx.req as any)._params?.['id']
```

## 📚 相關文檔

- [Hono 官方文檔](https://hono.dev/)
- [Deno 文檔](https://deno.land/)
- [WebCube2027 專案結構](./project-structure.md)

---

**🎊 WebCube2027 路由器 - 讓動態路由變得簡單！**
