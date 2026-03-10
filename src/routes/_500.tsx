import type { Context } from 'hono'

/** 500 伺服器錯誤頁面 */
export default function 錯誤500(ctx: Context, error?: Error) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <div className="text-6xl font-bold text-red-400">🔥</div>
          <h1 className="text-4xl font-bold text-red-400 mt-4">500</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-300">
            伺服器內部錯誤
          </h2>
          
          <p className="text-slate-400">
            伺服器發生了未預期的錯誤，我們正在處理這個問題。
          </p>
          
          {error && (
            <div className="space-y-2">
              <p className="text-red-300 font-mono text-sm">
                錯誤：{error.message}
              </p>
              {error.stack && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                    查看詳細錯誤資訊
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 space-x-4">
          <a 
            href="/" 
            className="inline-flex items-center rounded-lg border border-cyan-400 bg-cyan-400/10 px-6 py-3 text-cyan-300 transition-colors hover:bg-cyan-400/20"
          >
            ← 返回首頁
          </a>
          <button 
            type="button"
            onClick={() => globalThis.location.reload()}
            className="rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 text-slate-300 transition-colors hover:bg-slate-800"
          >
            重新整理
          </button>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          <p>WebCube2027 檔案路由器</p>
          <p className="mt-1">錯誤 ID: {crypto.randomUUID()}</p>
        </div>
      </div>
    </div>
  )
}
