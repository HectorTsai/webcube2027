interface 經典佈局Props {
  children: unknown
}

export default function 經典佈局({ children }: 經典佈局Props) {
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
      <footer className="webcube-頁尾 flex-shrink-0">
        <div className="webcube-容器">
          <p className="webcube-描述 text-center">
            Powered by Deno + Hono + UnoCSS + 檔案路由器
          </p>
        </div>
      </footer>
    </div>
  )
}
