import type { Context } from 'hono'

export default function 使用者頁面(ctx: Context) {
  // 方式 A: 嘗試你覆蓋後的 param
  const usernameA = ctx.req.param('username')
  
  // 方式 B: 從我們剛才設定的 set 中獲取 (最穩定)
  const params = ctx.get('params') as Record<string, string>
  const usernameB = params?.['username']
  
  // 方式 C: 從實驗性的 _params 獲取
  const usernameC = (ctx.req as any)._params?.['username']
  
  // 最終使用的值
  const finalUsername = usernameA || usernameB || usernameC || '未知'
  
  console.log(`[Users] username 參數獲取:`, { 
    usernameA, 
    usernameB, 
    usernameC, 
    finalUsername,
    params, 
    _params: (ctx.req as any)._params 
  })
  
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold text-cyan-400">使用者：{finalUsername}</h1>
        <p className="mt-2 text-slate-400">
          這是動態路由範例，從 URL 參數提取使用者名稱。
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">🔍 參數提取測試</h2>
        <div className="space-y-3 text-slate-200">
          <div className="flex justify-between">
            <span>ctx.req.param('username'):</span>
            <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm text-green-400">
              {usernameA || 'undefined'}
            </code>
          </div>
          <div className="flex justify-between">
            <span>ctx.get('params')['username']:</span>
            <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm text-blue-400">
              {usernameB || 'undefined'}
            </code>
          </div>
          <div className="flex justify-between">
            <span>(ctx.req as any)._params?.['username']:</span>
            <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm text-purple-400">
              {usernameC || 'undefined'}
            </code>
          </div>
          <div className="border-t border-slate-700 pt-3 mt-3">
            <div className="flex justify-between font-semibold">
              <span>✅ 最終值:</span>
              <code className="rounded bg-green-900/50 px-2 py-1 font-mono text-sm text-green-300">
                {finalUsername}
              </code>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold text-cyan-300">📋 路由資訊</h2>
        <ul className="space-y-2 text-slate-200">
          <li>檔案：<code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">users/[username].tsx</code></li>
          <li>URL：<code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">{ctx.req.path}</code></li>
          <li>模式：<code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">/users/:username</code></li>
        </ul>
      </section>

      <section>
        <nav className="pt-4 space-x-4">
          <a href="/" className="text-cyan-300 hover:text-cyan-200">
            ← 返回首頁
          </a>
          <a href="/users/admin" className="text-cyan-300 hover:text-cyan-200">
            測試 admin
          </a>
          <a href="/users/測試中文" className="text-cyan-300 hover:text-cyan-200">
            測試中文
          </a>
        </nav>
      </section>
    </div>
  )
}
