import type { Context } from 'hono'

/** 一般錯誤處理器 */
export default function ErrorHandler(error: Error, ctx: Context): Response {
  const 錯誤頁面 = (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100">
      <div className="text-center max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-400">Error</h1>
        </div>
        
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-2xl font-semibold text-slate-300 mb-2">
              錯誤訊息
            </h2>
            <p className="text-slate-400 font-mono bg-slate-800 p-3 rounded">
              {error.message}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              錯誤類型
            </h3>
            <p className="text-slate-400 font-mono bg-slate-800 p-3 rounded">
              {error.constructor.name}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              請求資訊
            </h3>
            <div className="text-slate-400 font-mono bg-slate-800 p-3 rounded text-sm">
              <p>方法: {ctx.req.method}</p>
              <p>路徑: {ctx.req.path}</p>
              <p>URL: {ctx.req.url}</p>
            </div>
          </div>

          {error.stack && (
            <div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                堆疊追蹤
              </h3>
              <pre className="text-slate-400 font-mono bg-slate-800 p-3 rounded text-xs overflow-auto max-h-64">
                {error.stack}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8">
          <a href="/" className="inline-flex items-center rounded-lg border border-red-400 bg-red-400/10 px-6 py-3 text-red-300 transition-colors hover:bg-red-400/20">
            ← 返回首頁
          </a>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          <p>WebCube2027 檔案路由器 - 錯誤處理器</p>
        </div>
      </div>
    </div>
  )

  return ctx.html(String(錯誤頁面), 500)
}
