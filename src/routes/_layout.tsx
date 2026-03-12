import type { Context } from 'hono'
import { 生成CSS變數 } from '../../presets/webcube.ts'

/** Layout 包裝器：包裝頁面內容，提供統一佈局 */
export default function Layout(Component: () => unknown, ctx: Context) {
  // 從 middleware 取得主題資料
  const 骨架資料 = ctx.get('骨架資料')
  const 配色資料 = ctx.get('配色資料')
  
  // 生成 CSS 變數
  const cssVariables = 生成CSS變數(骨架資料, 配色資料)

  return (
    <>
      {/* 注入動態 CSS 變數 */}
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      
      <div className="min-h-screen bg-背景1 text-背景內容">
        {/* 導航列 */}
        <header className="webcube-標頭">
          <nav className="webcube-容器">
            <div className="webcube-兩端對齊">
              <h1 className="webcube-標題">WebCube2027</h1>
              <div className="flex gap-4">
                <a href="/" className="webcube-文字 hover:text-主色">首頁</a>
                <a href="/about" className="webcube-文字 hover:text-主色">關於</a>
                <a href="/users/demo" className="webcube-文字 hover:text-主色">使用者</a>
                <a href="/_routes" className="webcube-文字 hover:text-主色">路由</a>
              </div>
            </div>
          </nav>
        </header>

        {/* 主要內容 */}
        <main className="webcube-容器 py-8">
          <div className="webcube-卡片">
            {Component()}
          </div>
        </main>

        {/* 頁尾 */}
        <footer className="webcube-頁尾">
          <div className="webcube-容器">
            <p className="webcube-描述 text-center">
              Powered by Deno + Hono + UnoCSS + 檔案路由器
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
