import type { Context } from 'hono'

export default function 登入頁面(ctx: Context) {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-cyan-400">🔑 登入</h1>
        <p className="mt-4 text-lg text-slate-300">
          請登入以存取管理面板。
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">登入表單</h2>
        <form method="post" action="/admin" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              使用者名稱
            </label>
            <input 
              type="text" 
              name="username" 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              密碼
            </label>
            <input 
              type="password" 
              name="password" 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              placeholder="password"
            />
          </div>
          <button 
            type="submit"
            className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            登入
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-yellow-800 bg-yellow-900/20 p-6">
        <h2 className="text-xl font-semibold text-yellow-300">快速測試</h2>
        <p className="text-yellow-200 text-sm mb-4">
          點擊下方連結測試內部重導向功能：
        </p>
        <div className="grid gap-3">
          <a 
            href="/admin" 
            className="block w-full rounded-lg border border-yellow-700 bg-yellow-800/50 p-4 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-800"
          >
            → 直接訪問管理面板（將被重導向到此頁面）
          </a>
          <a 
            href="/admin" 
            className="block w-full rounded-lg border border-green-700 bg-green-800/50 p-4 text-green-300 hover:border-green-400 hover:bg-green-800"
            onClick={(e) => {
              e.preventDefault()
              // 添加 Authorization header 並重新導向
              window.location.href = '/admin'
              // 模擬設置 header（實際上需要用 fetch 或其他方式）
              console.log('設置 Authorization header...')
            }}
          >
            → 帶權限訪問管理面板（模擬）
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
