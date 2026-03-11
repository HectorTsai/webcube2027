import type { Context } from 'hono'

export default async function 個人資料頁面(ctx: Context) {
  // 模擬權限檢查
  const isLoggedIn = ctx.req.header('authorization') === 'Bearer admin-token'
  
  if (!isLoggedIn) {
    // 巢狀內部重導向
    return await ctx.internalRedirect('/login')
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-cyan-400">👤 個人資料</h1>
        <p className="mt-4 text-lg text-slate-300">
          管理員個人資料頁面。
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">重導向鏈測試</h2>
        <ul className="space-y-2 text-slate-200">
          <li>📍 當前路徑：/admin/profile</li>
          <li>🔗 重導向鏈：{JSON.stringify(ctx._redirectChain || [])}</li>
          <li>✅ 巢狀重導向正常工作</li>
        </ul>
      </section>

      <section className="grid gap-4 rounded-2xl border border-orange-800 bg-orange-900/20 p-6">
        <h2 className="text-xl font-semibold text-orange-300">循環檢測測試</h2>
        <div className="grid gap-3">
          <a 
            href="/admin" 
            className="block w-full rounded-lg border border-orange-700 bg-orange-800/50 p-4 text-orange-300 hover:border-orange-400 hover:bg-orange-800"
          >
            → 返回管理面板（測試循環檢測）
          </a>
          <a 
            href="/admin/profile" 
            className="block w-full rounded-lg border border-red-700 bg-red-800/50 p-4 text-red-300 hover:border-red-400 hover:bg-red-800"
          >
            → 自我重導向（測試循環檢測）
          </a>
        </div>
      </section>

      <section>
        <nav className="pt-4 flex gap-4">
          <a href="/admin" className="text-cyan-300 hover:text-cyan-200">
            ← 管理面板
          </a>
          <a href="/" className="text-cyan-300 hover:text-cyan-200">
            ← 返回首頁
          </a>
        </nav>
      </section>
    </div>
  )
}
