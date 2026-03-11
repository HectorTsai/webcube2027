import type { Context } from 'hono'

/** Layout 包裝器：包裝頁面內容，提供統一佈局 */
export default function Layout(Component: () => unknown, _ctx: Context) {
  return (
    <div className="min-h-screen">
      {/* 導航列 */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <nav className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-cyan-400">WebCube2027</h1>
            <div className="flex gap-4">
              <a href="/" className="text-cyan-300 hover:text-cyan-200">首頁</a>
              <a href="/about" className="text-cyan-300 hover:text-cyan-200">關於</a>
              <a href="/users/demo" className="text-cyan-300 hover:text-cyan-200">使用者</a>
              <a href="/_routes" className="text-cyan-300 hover:text-cyan-200">路由</a>
            </div>
          </div>
        </nav>
      </header>

      {/* 主要內容 */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {Component()}
      </main>

      {/* 頁尾 */}
      <footer className="mt-16 border-t border-slate-800">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <p className="text-center text-slate-500 text-sm">
            Powered by Deno + Hono + UnoCSS + 檔案路由器
          </p>
        </div>
      </footer>
    </div>
  )
}
