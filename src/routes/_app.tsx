import type { Context } from 'hono'

/** App 包裝器：包裝所有頁面的最外層 */
export default function App(Component: () => unknown, _ctx: Context) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>WebCube2027</title>
        <link rel="stylesheet" href="/uno.css" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Partial 導航系統
            let isPartialEnabled = true
            let loadingElement = null
            
            // 初始化
            document.addEventListener('DOMContentLoaded', () => {
              // 找到內容容器
              loadingElement = document.querySelector('body')
              
              // 攔截導航
              document.addEventListener('click', handleNavigation)
              
              // 處理瀏覽器前進/後退
              window.addEventListener('popstate', handlePopState)
              
              console.log('[Partial] 導航系統已初始化')
            })
            
            // 處理導航點擊
            function handleNavigation(e) {
              if (!isPartialEnabled) return
              
              const link = e.target.closest('a')
              if (!link) return
              
              const href = link.getAttribute('href')
              if (!href) return
              
              // 只處理內部連結
              if (href.startsWith('http') || href.startsWith('//')) return
              if (href.startsWith('#')) return
              
              e.preventDefault()
              loadPartial(href)
            }
            
            // 處理瀏覽器前進/後退
            function handlePopState() {
              loadPartial(window.location.pathname)
            }
            
            // 載入 Partial 內容
            async function loadPartial(url) {
              try {
                // 顯示載入動畫
                showLoading()
                
                console.log(\`[Partial] 載入: \${url}\`)
                
                // 測試用：模擬網路延遲，讓效果更明顯
                if (url.includes('test-delay')) {
                  console.log('[Partial] 測試延遲 2 秒')
                  await new Promise(resolve => setTimeout(resolve, 2000))
                } else {
                  // 正常情況下也加一點點延遲讓動畫可見
                  await new Promise(resolve => setTimeout(resolve, 300))
                }
                
                // 發送 Partial 請求
                const response = await fetch(url, {
                  headers: { 'X-Partial': 'true' }
                })
                
                if (!response.ok) {
                  throw new Error(\`HTTP \${response.status}\`)
                }
                
                const html = await response.text()
                
                // 更新內容
                document.body.innerHTML = html
                
                // 更新 URL
                history.pushState({}, '', url)
                
                // 滾動到頂部
                window.scrollTo(0, 0)
                
                console.log(\`[Partial] 載入完成: \${url}\`)
                
              } catch (error) {
                console.error(\`[Partial] 載入失敗: \${url}\`, error)
                
                // 失敗時回退到完整頁面載入
                window.location.href = url
              }
            }
            
            // 顯示載入動畫
            function showLoading() {
              if (loadingElement) {
                loadingElement.innerHTML = \`
                  <div class="flex items-center justify-center min-h-screen">
                    <div class="flex flex-col items-center space-y-4">
                      <div class="relative">
                        <div class="w-12 h-12 border-4 border-slate-700 rounded-full"></div>
                        <div class="absolute top-0 left-0 w-12 h-12 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p class="text-slate-400 text-sm animate-pulse">載入中...</p>
                    </div>
                  </div>
                \`
              }
            }
            
            // 停用 Partial 導航（用於表單提交等）
            window.disablePartialNavigation = () => {
              isPartialEnabled = false
              console.log('[Partial] 導航系統已停用')
            }
            
            // 啟用 Partial 導航
            window.enablePartialNavigation = () => {
              isPartialEnabled = true
              console.log('[Partial] 導航系統已啟用')
            }
          `
        }} />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {typeof Component === 'function' ? Component() : Component}
      </body>
    </html>
  )
}
