import 頁尾 from '../頁尾.tsx'

interface 經典佈局Props {
  children: unknown
  風格: string
  baseURL: string
}

export default async function 經典佈局({ children, 風格, baseURL }: 經典佈局Props) {
  // 預載入頁尾元件
  const 頁尾元件 = await 頁尾({ 風格, 版權: "© 2026 WebCube2027. 版權所有.", 連結: [
    { 標籤: '首頁', 連結: '/' },
    { 標籤: '關於', 連結: '/about' },
    { 標籤: '文件', 連結: '/docs' }
  ], 顏色: "主要" })

  return (
    <div className="layout-container bg-背景1 text-背景內容">
      <header className="webcube-標頭 flex-shrink-0">
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
      <main className="layout-main">
        <div className="webcube-容器 py-8">
          <div className="webcube-卡片">
            {children}
          </div>
        </div>
      </main>
      {頁尾元件}
    </div>
  )
}
