import type { Context } from 'hono'

/** 404 錯誤頁面 */
export default function 錯誤404(ctx: Context) {
  const 請求路徑 = ctx.req.path

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-cyan-400">404</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-300">
            頁面找不到
          </h2>
          <p className="text-slate-400">
            找不到路徑 <code className="rounded bg-slate-800 px-2 py-1 font-mono text-sm">{請求路徑}</code>
          </p>
        </div>

        <div className="mt-8">
          <a 
            href="/" 
            className="inline-flex items-center rounded-lg border border-cyan-400 bg-cyan-400/10 px-6 py-3 text-cyan-300 transition-colors hover:bg-cyan-400/20"
          >
            ← 返回首頁
          </a>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          <p>WebCube2027 檔案路由器</p>
        </div>
      </div>
    </div>
  )
}
