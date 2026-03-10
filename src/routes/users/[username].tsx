import type { Context } from 'hono'

export default function 使用者頁面(ctx: Context) {
  const username = ctx.req.param('username')
  
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-cyan-400">使用者：{username}</h1>
        <p className="mt-2 text-slate-400">
          這是動態路由範例，從 URL 參數提取使用者名稱。
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">路由資訊</h2>
        <ul className="space-y-2 text-slate-200">
          <li>檔案：<code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">users/[username].tsx</code></li>
          <li>參數：<code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">username = {username}</code></li>
          <li>模式：<code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">/users/:username</code></li>
        </ul>
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
