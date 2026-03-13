import type { Context } from 'hono'

/** App 包裝器：包裝所有頁面的最外層 */
export default async function App(Component: () => Promise<unknown>, ctx: Context) {
  // 從 middleware 取得骨架資料
  const 骨架資料 = ctx.get('骨架資料')
  
  // 直接使用載入器字串，不需要複雜邏輯
  const 圖示ID = 骨架資料?.載入器 || "spinner"
  
  // 在服務端直接取得圖示內容
  let 載入器圖示內容 = ''
  try {
    const 圖示回應 = await fetch(`${ctx.get('uri').origin}/api/icons/${圖示ID}`)
    if (圖示回應.ok) {
      const 圖示資料 = await 圖示回應.json()
      載入器圖示內容 = 圖示資料.內容
      console.log(`[App] 成功取得載入器圖示: ${圖示ID}`)
    } else {
      console.log(`[App] 圖示 API 失敗: ${圖示ID}, 狀態: ${圖示回應.status}`)
    }
  } catch (error) {
    console.log(`[App] 取得圖示失敗: ${圖示ID}`, error)
  }
  
  // 如果 API 失敗，使用後備圖示
  if (!載入器圖示內容) {
    載入器圖示內容 = '<div class="animate-spin w-16 h-16 border-4 border-current rounded-full border-t-transparent"></div>'
  }
  
  // 等待 Component 執行完成
  const componentResult = await Component()

  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>WebCube2027</title>
        <link rel="stylesheet" href="/uno.css" />
        {/* 開發模式下注入熱加載腳本 */}
        {ctx.get('uri')?.origin?.includes('localhost') && (
          <script src="/hot-reload.js"></script>
        )}
        <script dangerouslySetInnerHTML={{
          __html: `
            // 注入載入器圖示內容到前端
            window.載入器圖示內容 = \`${載入器圖示內容}\`;
            console.log('[App] 載入器圖示內容已注入');
            
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
                
                // 找到主要內容區域並更新
                const mainContent = document.querySelector('main .webcube-卡片')
                if (mainContent) {
                  mainContent.innerHTML = html
                } else {
                  // 如果找不到目標容器，回退到完整頁面載入
                  console.warn('[Partial] 找不到主要內容容器，回退到完整頁面')
                  window.location.href = url
                  return
                }
                
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
            async function showLoading() {
              console.log('[Partial] 開始顯示載入動畫')
              if (loadingElement) {
                // 找到主要內容區域
                const mainContent = document.querySelector('main .webcube-卡片')
                if (mainContent) {
                  try {
                    // 直接使用預設的載入器圖示內容，不需要 API 呼叫
                    console.log('[Partial] 使用預設載入器圖示內容')
                    
                    mainContent.innerHTML = \`
                        <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
                          <div class="flex flex-col items-center space-y-4">
                            <div style="width: 64px; height: 64px;">
                              \${window.載入器圖示內容}
                            </div>
                            <p class="webcube-文字 animate-pulse text-lg">載入中...</p>
                          </div>
                        </div>
                      \`
                    } catch (error) {
                    console.log('[Partial] 載入器圖示顯示失敗:', error)
                    // 使用後備 CSS 動畫
                    mainContent.innerHTML = \`
                      <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
                        <div class="flex flex-col items-center space-y-4">
                          <div class="relative">
                            <div class="w-16 h-16 border-4 border-背景3 rounded-full"></div>
                            <div class="absolute top-0 left-0 w-16 h-16 border-4 border-主色 rounded-full border-t-transparent animate-spin"></div>
                          </div>
                          <p class="webcube-文字 animate-pulse text-lg">載入中...</p>
                        </div>
                      </div>
                    \`
                  }
                } else {
                  console.log('[Partial] 找不到 main .webcube-卡片，使用 body')
                  // 如果找不到目標容器，使用 body 作為備選
                  try {
                    // 直接使用預設的載入器圖示內容，不需要 API 呼叫
                    loadingElement.innerHTML = \`
                        <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
                          <div class="flex flex-col items-center space-y-4">
                            <div style="width: 64px; height: 64px;">
                              \${window.載入器圖示內容}
                            </div>
                            <p class="text-slate-400 text-sm animate-pulse text-lg">載入中...</p>
                          </div>
                        </div>
                      \`
                  } catch (error) {
                    console.log('[Partial] 載入器圖示顯示失敗:', error)
                    // 使用後備 CSS 動畫
                    loadingElement.innerHTML = \`
                      <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
                        <div class="flex flex-col items-center space-y-4">
                          <div class="relative">
                            <div class="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                            <div class="absolute top-0 left-0 w-16 h-16 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                          </div>
                          <p class="text-slate-400 text-sm animate-pulse text-lg">載入中...</p>
                        </div>
                      </div>
                    \`
                  }
                }
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
      <body className="min-h-screen bg-transparent text-slate-100">
        {componentResult}
      </body>
    </html>
  )
}
