import type { Context } from 'hono'

export default async function Admin頁面(ctx: Context) {
  // 模擬權限檢查
  const isLoggedIn = ctx.req.header('authorization') === 'Bearer admin-token'
  
  if (!isLoggedIn) {
    // 使用內部重導向到登入頁面
    return await ctx.internalRedirect('/login')
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-cyan-400">🔐 管理面板</h1>
        <p className="mt-4 text-lg text-slate-300">
          歡迎來到管理面板！這是通過內部重導向到達的。
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">重導向資訊</h2>
        <ul className="space-y-2 text-slate-200">
          <li>✅ 權限檢查通過</li>
          <li>✅ 使用內部重導向（高效能）</li>
          <li>✅ 沒有重新發送 HTTP 請求</li>
          <li>✅ 中間件鏈不會重新執行</li>
        </ul>
      </section>

      <section className="grid gap-4 rounded-2xl border border-green-800 bg-green-900/20 p-6">
        <h2 className="text-xl font-semibold text-green-300">測試連結</h2>
        <div className="grid gap-3">
          <a href="/admin/profile" className="block w-full rounded-lg border border-green-700 bg-green-800/50 p-4 text-green-300 hover:border-green-400 hover:bg-green-800">
            → 個人資料（巢狀內部重導向）
          </a>
          <a href="/logout" className="block w-full rounded-lg border border-red-700 bg-red-800/50 p-4 text-red-300 hover:border-red-400 hover:bg-red-800">
            → 登出（外部重導向）
          </a>
        </div>
      </section>

      <section>
        <nav className="pt-4">
          <a href="/" className="text-cyan-300 hover:text-cyan-200">
            ← 返回首頁
          </a>
        </nav>
      </section>
    </div>
  )
}
