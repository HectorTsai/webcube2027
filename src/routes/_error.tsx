import type { Context } from 'hono'

/** 通用錯誤頁面 */
export default function 錯誤頁面(ctx: Context, error?: Error) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-red-400">⚠️</div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-300">
            發生錯誤
          </h1>
          
          {error && (
            <div className="space-y-2">
              <p className="text-red-300">
                {error.message}
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
          
          {!error && (
            <p className="text-slate-400">
              伺服器發生未預期的錯誤，請稍後再試。
            </p>
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
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 text-slate-300 transition-colors hover:bg-slate-800"
          >
            重新整理
          </button>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          <p>WebCube2027 檔案路由器</p>
        </div>
      </div>
    </div>
  )
}
