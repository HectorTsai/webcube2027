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
          <a href="/_routes" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800">
            → 查看所有路由（除錯）
          </a>
        </div>
      </section>
    </div>
  )
}
