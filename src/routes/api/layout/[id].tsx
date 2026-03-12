import type { Context } from 'hono'

export default async function LayoutAPI(ctx: Context) {
  let layoutId = ctx.req.path.split('/').pop() || ''
  
  // 如果是 'default'，當作空字串處理
  if (layoutId === 'default') {
    layoutId = ''
  }
  
  const userLang = ctx.get('語言') as string
  const siteDb = ctx.get('網站資料庫') as any
  const sysDb = ctx.get('系統資料庫') as any

  // 1. 嘗試從網站資料庫取得佈局元件
  if (siteDb) {
    try {
      const result = await siteDb.查詢(`SELECT * FROM 元件 WHERE id = '${layoutId}'`)
      if (result && result.length > 0) {
        const component = result[0] as any
        // 檢查是否有佈局標籤
        if (component.標籤集 && component.標籤集.includes('元件:標籤:佈局')) {
          return ctx.json({
            jsx: component.代碼 || '',
            格式: 'HTML',
            名稱: component.名稱 || '佈局元件',
            成功: true
          })
        }
      }
    } catch (error) {
      console.log(`[API] 佈局 ${layoutId} 從網站資料庫取得失敗:`, error)
    }
  }

  // 2. 嘗試從系統資料庫取得佈局元件
  if (sysDb) {
    try {
      const result = await sysDb.查詢(`SELECT * FROM 元件 WHERE id = '${layoutId}'`)
      if (result && result.length > 0) {
        const component = result[0] as any
        // 檢查是否有佈局標籤
        if (component.標籤集 && component.標籤集.includes('元件:標籤:佈局')) {
          return ctx.json({
            jsx: component.代碼 || '',
            格式: 'HTML',
            名稱: component.名稱 || '佈局元件',
            成功: true
          })
        }
      }
    } catch (error) {
      console.log(`[API] 佈局 ${layoutId} 從系統資料庫取得失敗:`, error)
    }
  }

  // 3. 預設佈局（目前 _layout.tsx 的內容）
  const defaultLayout = `
    <div class="layout-container bg-背景1 text-背景內容">
      <header class="webcube-標頭 flex-shrink-0">
        <nav class="webcube-容器">
          <div class="webcube-兩端對齊">
            <h1 class="webcube-標題">WebCube2027</h1>
            <div class="flex gap-4">
              <a href="/" class="webcube-文字 hover:text-主色">首頁</a>
              <a href="/about" class="webcube-文字 hover:text-主色">關於</a>
              <a href="/users/demo" class="webcube-文字 hover:text-主色">使用者</a>
              <a href="/_routes" class="webcube-文字 hover:text-主色">路由</a>
            </div>
          </div>
        </nav>
      </header>
      <main class="layout-main">
        <div class="webcube-容器 py-8">
          <div class="webcube-卡片">
            {{CONTENT}}
          </div>
        </div>
      </main>
      <footer class="webcube-頁尾 flex-shrink-0">
        <div class="webcube-容器">
          <p class="webcube-描述 text-center">
            Powered by Deno + Hono + UnoCSS + 檔案路由器
          </p>
        </div>
      </footer>
    </div>
  `

  const fallbackNames = {
    'zh-tw': '預設佈局',
    'en': 'Default Layout',
    'vi': 'Bố cục mặc định'
  }

  return ctx.json({
    jsx: defaultLayout,
    格式: 'HTML',
    名稱: fallbackNames[userLang as keyof typeof fallbackNames] || '預設佈局',
    成功: false
  })
}
