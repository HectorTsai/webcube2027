import type { Context } from 'hono'

/** 一般錯誤處理器 */
export default function ErrorHandler(error: Error, ctx: Context): Response {
  const 錯誤頁面 = (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-400">Error</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-300">
            發生錯誤
          </h2>
          <p className="text-slate-400">
            {error.message}
          </p>
        </div>

        <div className="mt-8">
          <a href="/" className="inline-flex items-center rounded-lg border border-red-400 bg-red-400/10 px-6 py-3 text-red-300 transition-colors hover:bg-red-400/20">
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
