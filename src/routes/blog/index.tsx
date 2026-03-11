export default function Blog首頁() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-purple-400">Blog 首頁</h1>
        <p className="mt-4 text-lg text-slate-300">
          這是 Blog 模塊的首頁，使用了專用的 Blog Layout。
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-purple-300">巢狀 Layout 測試</h2>
        <ul className="space-y-2 text-slate-200">
          <li>✅ 全域 Layout（灰色導航）</li>
          <li>✅ Blog Layout（紫色導航）</li>
          <li>✅ 頁面內容（這裡）</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-purple-300 mb-4">測試連結</h2>
        <div className="grid gap-3">
          <a href="/blog/posts/hello-world" className="block w-full rounded-lg border border-purple-700 bg-purple-800/50 p-4 text-purple-300 hover:border-purple-400 hover:bg-purple-800">
            → 測試動態路由：/blog/posts/hello-world
          </a>
          <a href="/about" className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-slate-300 hover:border-cyan-400 hover:bg-slate-800">
            → 關於頁面（使用全域 Layout）
          </a>
        </div>
      </section>
    </div>
  )
}
