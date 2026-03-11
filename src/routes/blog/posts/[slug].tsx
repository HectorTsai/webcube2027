import type { Context } from 'hono'

export default function 文章頁面(ctx: Context) {
  const slug = ctx.req.param('slug')
  
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-purple-400">文章：{slug}</h1>
        <p className="mt-2 text-slate-400">
          這是巢狀動態路由範例，位於 /blog/posts/[slug].tsx
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-purple-300">路由層級</h2>
        <ul className="space-y-2 text-slate-200">
          <li>📁 <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">/blog/_layout.tsx</code> - Blog Layout</li>
          <li>📄 <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">/blog/posts/[slug].tsx</code> - 動態文章頁面</li>
          <li>🔗 <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">slug = {slug}</code></li>
        </ul>
      </section>

      <section className="grid gap-4 rounded-2xl border border-purple-800 bg-purple-900/20 p-6">
        <h2 className="text-xl font-semibold text-purple-300">Layout 包裝順序</h2>
        <ol className="space-y-2 text-purple-200 list-decimal list-inside">
          <li>全域 App 包裝器（HTML 文檔）</li>
          <li>全域 Layout 包裝器（灰色導航）</li>
          <li>Blog Layout 包裝器（紫色導航）</li>
          <li>頁面內容（這裡）</li>
        </ol>
      </section>

      <section>
        <nav className="pt-4 flex gap-4">
          <a href="/blog" className="text-purple-300 hover:text-purple-200">
            ← Blog 首頁
          </a>
          <a href="/" className="text-cyan-300 hover:text-cyan-200">
            ← 返回主站
          </a>
        </nav>
      </section>
    </div>
  )
}
