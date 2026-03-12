import type { Context } from 'hono'

/** App 包裝器：包裝所有頁面的最外層 */
export default async function App(Component: () => Promise<unknown>, _ctx: Context) {
  // 等待 Component 執行完成
  const componentResult = await Component()

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
                    // 呼叫圖示 API 取得載入動畫
                    console.log('[Partial] 呼叫 API: /api/icons/圖示:圖示:spinner')
                    const response = await fetch('/api/icons/圖示:圖示:spinner')
                    console.log('[Partial] API 回應狀態:', response.status)
                    
                    if (response.ok) {
                      const iconData = await response.json()
                      console.log('[Partial] API 成功，圖示資料:', iconData)
                      mainContent.innerHTML = \`
                        <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
                          <div class="flex flex-col items-center space-y-4">
                            <div style="width: 64px; height: 64px;">
                              \${iconData.內容}
                            </div>
                            <p class="webcube-文字 animate-pulse text-lg">載入中...</p>
                          </div>
                        </div>
                      \`
                    } else {
                      console.log('[Partial] API 失敗，狀態:', response.status)
                      throw new Error('API 失敗')
                    }
                  } catch (error) {
                    console.log('[Partial] API 錯誤，使用後備 CSS 動畫:', error)
                    // API 失敗時使用後備 CSS 動畫
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
                    // 呼叫圖示 API 取得載入動畫
                    const response = await fetch('/api/icons/圖示:圖示:spinner')
                    if (response.ok) {
                      const iconData = await response.json()
                      loadingElement.innerHTML = \`
                        <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
                          <div class="flex flex-col items-center space-y-4">
                            <div style="width: 64px; height: 64px;">
                              \${iconData.內容}
                            </div>
                            <p class="text-slate-400 text-sm animate-pulse text-lg">載入中...</p>
                          </div>
                        </div>
                      \`
                    } else {
                      throw new Error('API 失敗')
                    }
                  } catch (error) {
                    // API 失敗時使用後備 CSS 動畫
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
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {componentResult}
      </body>
    </html>
  )
}
