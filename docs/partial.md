# Partial 導航系統設計

## 概述

WebCube2027 的 Partial 導航系統提供 SPA（單頁應用）級別的使用者體驗，實現無閃爍的頁面切換，同時保持傳統多頁應用的 SEO 友善性和初始載入效能。

## 設計目標

### 1. 無閃爍導航
- **問題**：傳統多頁應用切換時會整頁重新載入，造成閃爍
- **解決**：只更新內容區域，保持導航列和頁尾不變
- **效果**：流暢的使用者體驗，接近 SPA

### 2. SEO 友善
- **初始載入**：完整的 HTML 結構，有利於搜尋引擎
- **後續導航**：Partial 更新，提升使用者體驗
- **漸進增強**：JavaScript 失效時仍可正常導航

### 3. 向後相容
- **傳統導航**：直接訪問 URL 正常工作
- **瀏覽器支援**：前進/後退按鈕正常運作
- **錯誤處理**：Partial 失敗時回退到完整頁面

## 技術架構

### 前端架構

```javascript
// Partial 導航系統
class PartialNavigation {
  constructor() {
    this.isEnabled = true
    this.loadingElement = null
    this.init()
  }

  init() {
    // 攔截導航
    document.addEventListener('click', this.handleNavigation.bind(this))
    
    // 處理瀏覽器歷史
    window.addEventListener('popstate', this.handlePopState.bind(this))
    
    // 找到內容容器
    this.loadingElement = document.querySelector('body')
  }

  // 攔截連結點擊
  handleNavigation(e) {
    const link = e.target.closest('a')
    if (!this.shouldIntercept(link)) return
    
    e.preventDefault()
    this.loadPartial(link.href)
  }

  // 判斷是否應該攔截
  shouldIntercept(link) {
    if (!link) return false
    if (!this.isEnabled) return false
    
    const href = link.getAttribute('href')
    if (!href) return false
    
    // 只處理內部連結
    return !href.startsWith('http') && 
           !href.startsWith('//') && 
           !href.startsWith('#')
  }

  // 載入 Partial 內容
  async loadPartial(url) {
    try {
      this.showLoading()
      
      const response = await fetch(url, {
        headers: { 'X-Partial': 'true' }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const html = await response.text()
      this.updateContent(html, url)
      
    } catch (error) {
      console.error('Partial 載入失敗:', error)
      // 回退到完整頁面載入
      window.location.href = url
    }
  }

  // 更新內容
  updateContent(html, url) {
    document.body.innerHTML = html
    history.pushState({}, '', url)
    window.scrollTo(0, 0)
  }

  // 顯示載入動畫
  showLoading() {
    this.loadingElement.innerHTML = this.getLoadingHTML()
  }

  // 載入動畫 HTML
  getLoadingHTML() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="flex flex-col items-center space-y-4">
          <div class="relative">
            <div class="w-12 h-12 border-4 border-slate-700 rounded-full"></div>
            <div class="absolute top-0 left-0 w-12 h-12 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p class="text-slate-400 text-sm animate-pulse">載入中...</p>
        </div>
      </div>
    `
  }
}
```

### 後端架構

```typescript
// router.ts - Partial 請求處理
async wrapComponent(handler: Function, ctx: Context, path: string): Promise<unknown> {
  // 先執行原始處理器
  const result = await handler(ctx)
  
  // 如果結果是 Response，直接返回
  if (result instanceof Response) {
    return result
  }
  
  // 檢查是否為 Partial 請求
  const isPartial = ctx.req.header('X-Partial') === 'true'
  
  if (isPartial) {
    // Partial 請求只返回原始內容，不包裝特殊檔案
    console.log(`[Router] Partial 請求: ${path}`)
    return result
  }
  
  // 完整頁面請求，進行 Layout 和 App 包裝
  const chain = this.getSpecialFilesChain(path).reverse()
  let renderer = () => result

  for (const specialFiles of chain) {
    if (specialFiles.layout) {
      const Layout = specialFiles.layout
      const prev = renderer
      renderer = () => Layout(prev, ctx)
    }
    if (specialFiles.app) {
      const App = specialFiles.app
      const prev = renderer
      renderer = () => App(prev, ctx)
    }
  }

  return await renderer()
}
```

## 實現細節

### 前端實現

#### 1. 初始化
```javascript
// 在 _app.tsx 中
document.addEventListener('DOMContentLoaded', () => {
  new PartialNavigation()
})
```

#### 2. 導航攔截
```javascript
handleNavigation(e) {
  const link = e.target.closest('a')
  if (!link) return
  
  const href = link.getAttribute('href')
  if (this.isInternalLink(href)) {
    e.preventDefault()
    this.loadPartial(href)
  }
}

isInternalLink(href) {
  return !href.startsWith('http') && 
         !href.startsWith('//') && 
         !href.startsWith('#')
}
```

#### 3. 載入處理
```javascript
async loadPartial(url) {
  this.showLoading()
  
  try {
    const response = await fetch(url, {
      headers: { 'X-Partial': 'true' }
    })
    
    const html = await response.text()
    this.updateContent(html, url)
    
  } catch (error) {
    this.handleError(error, url)
  }
}
```

#### 4. 內容更新
```javascript
updateContent(html, url) {
  // 更新 DOM
  document.body.innerHTML = html
  
  // 更新 URL
  history.pushState({}, '', url)
  
  // 滾動到頂部
  window.scrollTo(0, 0)
  
  // 觸发自定義事件
  document.dispatchEvent(new CustomEvent('partial-loaded', { 
    detail: { url } 
  }))
}
```

### 後端實現

#### 1. 請求檢測
```typescript
const isPartial = ctx.req.header('X-Partial') === 'true'
```

#### 2. 條件渲染
```typescript
if (isPartial) {
  // 只返回頁面內容
  return result
} else {
  // 返回完整頁面（包含 Layout 和 App）
  return wrapWithSpecialFiles(result, ctx, path)
}
```

#### 3. 特殊檔案處理
```typescript
// 完整頁面包裝順序
1. 執行頁面組件
2. Layout 包裝
3. App 包裝
4. 返回完整 HTML

// Partial 頁面
1. 執行頁面組件
2. 直接返回內容
```

## 使用方式

### 基本使用

**前端自動攔截：**
```html
<!-- 這些連結會被自動攔截 -->
<a href="/about">關於我們</a>
<a href="/users/jason">用戶資料</a>

<!-- 這些連結不會被攔截 -->
<a href="https://example.com">外部連結</a>
<a href="#section">錨點連結</a>
```

**手動觸發：**
```javascript
// 程式化觸發 Partial 導航
loadPartial('/about')

// 停用 Partial 導航
window.disablePartialNavigation()

// 重新啟用 Partial 導航
window.enablePartialNavigation()
```

### 事件監聽

```javascript
// 監聽 Partial 載入完成
document.addEventListener('partial-loaded', (e) => {
  console.log('頁面已載入:', e.detail.url)
  
  // 重新初始化組件
  initializeComponents()
})
```

## 效能優化

### 1. 載入動畫
- **立即顯示**：點擊後立即顯示載入動畫
- **視覺回饋**：讓用戶知道系統正在處理
- **避免白屏**：防止載入期間的空白

### 2. 網路優化
- **Partial 請求**：只傳輸必要內容，減少資料量
- **快取機制**：可以快取已載入的頁面
- **預載功能**：預載可能訪問的頁面

### 3. DOM 操作
- **最小化更新**：只更新必要的 DOM 元素
- **避免重排**：使用 innerHTML 替代多次 DOM 操作
- **記憶體管理**：清理事件監聽器

## 錯誤處理

### 前端錯誤處理

```javascript
async loadPartial(url) {
  try {
    const response = await fetch(url, {
      headers: { 'X-Partial': 'true' }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    this.updateContent(html, url)
    
  } catch (error) {
    console.error('Partial 載入失敗:', error)
    
    // 回退到完整頁面載入
    window.location.href = url
  }
}
```

### 後端錯誤處理

```typescript
try {
  const result = await handler(ctx)
  return isPartial ? result : wrapWithSpecialFiles(result, ctx, path)
} catch (error) {
  // 無論是否為 Partial，都使用統一的錯誤處理
  return handleError(error, ctx, path)
}
```

## 測試策略

### 1. 功能測試
- **基本導航**：點擊連結是否正確攔截
- **Partial 請求**：後端是否正確識別
- **內容更新**：DOM 是否正確更新
- **URL 更新**：瀏覽器 URL 是否正確

### 2. 錯誤測試
- **網路錯誤**：Partial 失敗時是否回退
- **404 錯誤**：不存在的頁面如何處理
- **JavaScript 失效**：是否仍可正常導航

### 3. 效能測試
- **載入速度**：Partial vs 完整頁面
- **記憶體使用**：長時間使用是否有記憶體洩漏
- **DOM 效能**：大量 DOM 操作的效能

### 4. 相容性測試
- **瀏覽器支援**：不同瀏覽器的相容性
- **裝置支援**：手機、平板、桌面
- **網路狀況**：慢速網路下的表現

## 未來擴展

### 1. 快取機制
```javascript
const pageCache = new Map()

async loadPartial(url) {
  if (pageCache.has(url)) {
    return pageCache.get(url)
  }
  
  const html = await fetchPartialContent(url)
  pageCache.set(url, html)
  return html
}
```

### 2. 過渡動畫
```javascript
async loadPartial(url) {
  // 淡出當前內容
  document.body.style.opacity = '0'
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // 載入新內容
  const html = await fetchPartialContent(url)
  document.body.innerHTML = html
  
  // 淡入新內容
  document.body.style.opacity = '1'
}
```

### 3. 表單支援
```javascript
document.addEventListener('submit', async (e) => {
  const form = e.target
  e.preventDefault()
  
  showLoading()
  
  const response = await fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'X-Partial': 'true' }
  })
  
  const result = await response.json()
  if (result.redirect) {
    loadPartial(result.redirect)
  }
})
```

### 4. 預載功能
```javascript
document.addEventListener('mouseover', (e) => {
  const link = e.target.closest('a')
  if (link && this.shouldIntercept(link)) {
    this.preloadPage(link.href)
  }
})
```

## 最佳實踐

### 1. 初始化
- 在 DOMContentLoaded 後初始化
- 檢查瀏覽器相容性
- 提供停用/啟用控制

### 2. 錯誤處理
- 優雅降級到完整頁面
- 記錄錯誤日誌
- 提供用戶友好的錯誤訊息

### 3. 效能優化
- 最小化 DOM 操作
- 使用 requestAnimationFrame
- 避免記憶體洩漏

### 4. 可維護性
- 模組化設計
- 清晰的 API
- 完整的測試覆蓋

## 總結

Partial 導航系統成功實現了：

- **無閃爍導航**：SPA 級別的使用者體驗
- **SEO 友善**：保持傳統多頁應用的優勢
- **向後相容**：支援各種使用場景
- **漸進增強**：JavaScript 失效時仍可正常運作
- **效能優化**：減少不必要的資料傳輸

這個系統為 WebCube2027 提供了現代化的導航體驗，同時保持了穩定性和相容性。
