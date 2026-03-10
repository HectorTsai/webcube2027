/**
 * 特殊檔案處理器
 * 處理 _app、_layout、_middleware 等特殊檔案
 */

import type { Context } from 'hono'

/** 特殊檔案載入器 */
export class 特殊檔案載入器 {
  private app包裝器?: (Component: any, ctx: Context) => any
  private layout包裝器?: (Component: any, ctx: Context) => any
  private middleware們: Array<(ctx: Context, next: () => Promise<void>) => Promise<void>> = []
  private 錯誤404頁面?: (ctx: Context) => any
  private 錯誤頁面?: (ctx: Context, error?: Error) => any
  private 錯誤500頁面?: (ctx: Context, error?: Error) => any

  /** 載入特殊檔案 */
  async 載入特殊檔案(): Promise<void> {
    try {
      // 載入 _app
      const app模組 = await import('../routes/_app.tsx')
      if (typeof app模組.default === 'function') {
        this.app包裝器 = app模組.default
        console.log('[special-handler] 已載入 _app 包裝器')
      }
    } catch (_錯誤) {
      console.log('[special-handler] 未找到 _app.tsx')
    }

    try {
      // 載入 _layout
      const layout模組 = await import('../routes/_layout.tsx')
      if (typeof layout模組.default === 'function') {
        this.layout包裝器 = layout模組.default
        console.log('[special-handler] 已載入 _layout 包裝器')
      }
    } catch (_錯誤) {
      console.log('[special-handler] 未找到 _layout.tsx')
    }

    try {
      // 載入 _middleware
      const middleware模組 = await import('../routes/_middleware.tsx')
      if (typeof middleware模組.default === 'function') {
        this.middleware們.push(middleware模組.default)
        console.log('[special-handler] 已載入 _middleware')
      }
    } catch (_錯誤) {
      console.log('[special-handler] 未找到 _middleware.tsx')
    }

    try {
      // 載入 _404
      const notFound模組 = await import('../routes/_404.tsx')
      if (typeof notFound模組.default === 'function') {
        this.錯誤404頁面 = notFound模組.default
        console.log('[special-handler] 已載入 _404 錯誤頁面')
      }
    } catch (_錯誤) {
      console.log('[special-handler] 未找到 _404.tsx')
    }

    try {
      // 載入 _500
      const error500模組 = await import('../routes/_500.tsx')
      if (typeof error500模組.default === 'function') {
        this.錯誤500頁面 = error500模組.default
        console.log('[special-handler] 已載入 _500 錯誤頁面')
      }
    } catch (_錯誤) {
      console.log('[special-handler] 未找到 _500.tsx')
    }

    try {
      // 載入 _error
      const error模組 = await import('../routes/_error.tsx')
      if (typeof error模組.default === 'function') {
        this.錯誤頁面 = error模組.default
        console.log('[special-handler] 已載入 _error 錯誤頁面')
      }
    } catch (_錯誤) {
      console.log('[special-handler] 未找到 _error.tsx')
    }
  }

  /** 執行中間件鏈 */
  async 執行中間件(ctx: Context, 最終處理: () => Promise<void>): Promise<void> {
    for (const 中間件 of this.middleware們) {
      await 中間件(ctx, 最終處理)
    }
  }

  /** 包裝頁面組件 */
  包裝頁面組件(元件: any, ctx: Context): any {
    // 如果沒有特殊檔案，直接返回原始元件
    if (!this.app包裝器 && !this.layout包裝器) {
      return 元件
    }

    // 建立包裝後的元件
    const 包裝後元件 = () => {
      let 內容 = 元件

      // 套用 Layout
      if (this.layout包裝器) {
        const Layout元件 = this.layout包裝器
        內容 = Layout元件(() => 內容, ctx)
      }

      // 套用 App
      if (this.app包裝器) {
        const App元件 = this.app包裝器
        內容 = App元件(() => 內容, ctx)
      }

      return 內容
    }

    return 包裝後元件()
  }

  /** 處理 404 錯誤 */
  處理404(ctx: Context): any {
    if (!this.錯誤404頁面) {
      // 預設 404 頁面
      const html = `
        <!DOCTYPE html>
        <html lang="zh-Hant">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>404 - 頁面找不到</title>
            <link rel="stylesheet" href="/uno.css" />
          </head>
          <body class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-9xl font-bold text-cyan-400">404</h1>
              <h2 class="text-2xl font-semibold text-slate-300 mt-4">頁面找不到</h2>
              <p class="text-slate-400 mt-2">找不到路徑 ${ctx.req.path}</p>
              <a href="/" class="inline-block mt-8 text-cyan-300 hover:text-cyan-200">← 返回首頁</a>
            </div>
          </body>
        </html>
      `
      return ctx.html(html, 404)
    }

    // 使用自定義 404 頁面
    const 元素 = this.錯誤404頁面(ctx)
    const 包裝後元素 = this.包裝頁面組件(元素, ctx)
    return ctx.html(包裝後元素, 404)
  }

  /** 處理一般錯誤 */
  處理錯誤(ctx: Context, error?: Error): any {
    // 優先使用 _500 錯誤頁面
    if (this.錯誤500頁面) {
      const 元素 = this.錯誤500頁面(ctx, error)
      const 包裝後元素 = this.包裝頁面組件(元素, ctx)
      return ctx.html(包裝後元素, 500)
    }

    // 其次使用通用錯誤頁面
    if (this.錯誤頁面) {
      const 元素 = this.錯誤頁面(ctx, error)
      const 包裝後元素 = this.包裝頁面組件(元素, ctx)
      return ctx.html(包裝後元素, 500)
    }

    // 預設錯誤頁面
    const html = `
        <!DOCTYPE html>
        <html lang="zh-Hant">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>發生錯誤</title>
            <link rel="stylesheet" href="/uno.css" />
          </head>
          <body class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
            <div class="text-center">
              <div class="text-6xl font-bold text-red-400">⚠️</div>
              <h1 class="text-3xl font-bold text-slate-300 mt-4">發生錯誤</h1>
              ${error ? `<p class="text-red-300 mt-2">${error.message}</p>` : ''}
              <a href="/" class="inline-block mt-8 text-cyan-300 hover:text-cyan-200">← 返回首頁</a>
            </div>
          </body>
        </html>
      `
    return ctx.html(html, 500)
  }

  /** 檢查是否有特殊檔案 */
  有特殊檔案(): boolean {
    return !!(
      this.app包裝器 || 
      this.layout包裝器 || 
      this.middleware們.length > 0 ||
      this.錯誤404頁面 ||
      this.錯誤頁面 ||
      this.錯誤500頁面
    )
  }
}
