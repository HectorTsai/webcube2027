export default function 首頁() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-cyan-400">WebCube2027 檔案路由器</h1>
        <p className="mt-4 text-lg text-slate-300">
          這是透過檔案路由器自動載入的首頁，支援特殊檔案：
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">特殊檔案功能</h2>
        <ul className="space-y-2 text-slate-200">
          <li>✅ <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">_app.tsx</code> - 全域 App 包裝器</li>
          <li>✅ <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">_layout.tsx</code> - 統一佈局</li>
          <li>✅ <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">_middleware.tsx</code> - 全域中間件</li>
          <li>✅ <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">_404.tsx</code> - 404 錯誤頁面</li>
          <li>✅ <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">_error.tsx</code> - 錯誤處理器</li>
          <li>✅ <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">_500.tsx</code> - 500 錯誤頁面</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-cyan-300 mb-4">測試路由</h2>
        <div className="grid gap-3">
          <a href="/about" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800">
            → 關於我們
          </a>
          <a href="/users/jason" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800">
            → 使用者頁面（動態路由）
          </a>
          <a href="/blog" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800">
            → Blog 首頁（巢狀路由）
          </a>
          <a href="/_routes" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800">
            → 查看所有路由（除錯）
          </a>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-green-800 bg-green-900/20 p-6">
        <h2 className="text-xl font-semibold text-green-300">🚀 內部重導向測試</h2>
        <div className="grid gap-3">
          <a href="/admin" className="block w-full rounded-lg border border-green-700 bg-green-800/50 p-4 text-green-300 hover:border-green-400 hover:bg-green-800">
            → 管理面板（無權限 → 內部重導向到登入）
          </a>
          <a href="/admin/profile" className="block w-full rounded-lg border border-green-700 bg-green-800/50 p-4 text-green-300 hover:border-green-400 hover:bg-green-800">
            → 個人資料（巢狀重導向測試）
          </a>
        </div>
        <p className="text-green-200 text-sm mt-2">
          💡 內部重導向不會重新發送 HTTP 請求，效能更高！
        </p>
      </section>
    </div>
  )
}
