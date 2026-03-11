import type { Context } from 'hono'

/** 500 伺服器錯誤頁面 */
export default function ServerError500(ctx: Context, error?: Error): Response {
  const 錯誤頁面 = (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-orange-400">500</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-300">
            伺服器內部錯誤
          </h2>
          <p className="text-slate-400">
            {error ? error.message : '伺服器發生了未預期的錯誤'}
          </p>
        </div>

        <div className="mt-8">
          <a href="/" className="inline-flex items-center rounded-lg border border-orange-400 bg-orange-400/10 px-6 py-3 text-orange-300 transition-colors hover:bg-orange-400/20">
            ← 返回首頁
          </a>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          <p>WebCube2027 檔案路由器</p>
        </div>
      </div>
    </div>
  )

  return ctx.html(String(錯誤頁面), 500)
}
