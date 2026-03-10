/**
 * 特殊檔案處理模組
 * 定義 _app、_middleware、_layout 等特殊檔案的處理邏輯
 */

import type { Context } from 'hono'
import type { 檔案路由器 } from './mod.ts'

/** 特殊檔案類型 */
export enum 特殊檔案類型 {
  APP = '_app',
  MIDDLEWARE = '_middleware', 
  LAYOUT = '_layout',
  ERROR = '_error',
  LOADING = '_loading',
}

/** 特殊檔案資訊 */
export interface 特殊檔案資訊 {
  類型: 特殊檔案類型
  檔案路徑: string
  處理函式: Function
}

/** App 包裝器類型 */
export type App包裝器 = (Component: any, ctx: Context) => any

/** 中間件類型 */
export type 中間件函式 = (ctx: Context, next: () => Promise<void>) => Promise<void>

/** Layout 包裝器類型 */
export type Layout包裝器 = (Component: any, ctx: Context) => any

/** 特殊檔案管理器 */
export class 特殊檔案管理器 {
  private app包裝器?: App包裝器
  private 中間件們: 中間件函式[] = []
  private layout包裝器?: Layout包裝器
  private 錯誤處理器?: (error: Error, ctx: Context) => any
  private 載入處理器?: (ctx: Context) => any

  /** 載入特殊檔案 */
  async 載入特殊檔案(路由器: 檔案路由器): Promise<void> {
    const 所有路由 = 路由器.取得所有路由()
    
    // 尋找特殊檔案
    for (const 路由項目 of 所有路由) {
      const 檔案名稱 = 路由項目.檔案路徑.split('/').pop()?.replace(/\.(tsx?|ts)$/, '')
      
      if (!檔案名稱) continue

      switch (檔案名稱) {
        case 特殊檔案類型.APP:
          this.app包裝器 = 路由項目.處理函式 as App包裝器
          console.log('[special-files] 已載入 App 包裝器')
          break
          
        case 特殊檔案類型.MIDDLEWARE:
          // 直接使用中間件函式，假設它已經是正確的簽名
          this.中間件們.push(路由項目.處理函式 as unknown as 中間件函式)
          console.log('[special-files] 已載入中間件')
          break
          
        case 特殊檔案類型.LAYOUT:
          this.layout包裝器 = 路由項目.處理函式 as Layout包裝器
          console.log('[special-files] 已載入 Layout 包裝器')
          break
          
        case 特殊檔案類型.ERROR:
          this.錯誤處理器 = 路由項目.處理函式 as unknown as (error: Error, ctx: Context) => any
          console.log('[special-files] 已載入錯誤處理器')
          break
          
        case 特殊檔案類型.LOADING:
          this.載入處理器 = 路由項目.處理函式 as (ctx: Context) => any
          console.log('[special-files] 已載入載入處理器')
          break
      }
    }
  }

  /** 執行中間件鏈 */
  async 執行中間件(ctx: Context, 最終處理: () => Promise<void>): Promise<void> {
    // 建立中間件鏈
    const 建立鏈 = (索引: number): (() => Promise<void>) => {
      if (索引 >= this.中間件們.length) {
        return 最終處理
      }
      return async () => {
        await this.中間件們[索引](ctx, 建立鏈(索引 + 1))
      }
    }
    
    await 建立鏈(0)()
  }

  /** 包裝頁面組件 */
  包裝頁面組件(元件: any, ctx: Context): any {
    let 包裝後元件 = 元件

    // 先套用 Layout
    if (this.layout包裝器) {
      包裝後元件 = this.layout包裝器!(元件, ctx)
    }

    // 再套用 App
    if (this.app包裝器) {
      包裝後元件 = this.app包裝器!(包裝後元件, ctx)
    }

    return 包裝後元件
  }

  /** 處理錯誤 */
  處理錯誤(error: Error, ctx: Context): any {
    if (this.錯誤處理器) {
      return this.錯誤處理器(error, ctx)
    }
    
    // 預設錯誤頁面
    return (
      <html lang="zh-Hant">
        <head>
          <meta charSet="utf-8" />
          <title>錯誤 - WebCube2027</title>
          <link rel="stylesheet" href="/uno.css" />
        </head>
        <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-400 mb-4">發生錯誤</h1>
            <p className="text-slate-300">{error.message}</p>
          </div>
        </body>
      </html>
    )
  }

  /** 處理載入狀態 */
  處理載入(ctx: Context): any {
    if (this.載入處理器) {
      return this.載入處理器(ctx)
    }
    
    // 預設載入頁面
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">載入中...</p>
        </div>
      </div>
    )
  }

  /** 檢查是否有特殊檔案 */
  有特殊檔案(): boolean {
    return !!(this.app包裝器 || this.中間件們.length > 0 || 
             this.layout包裝器 || this.錯誤處理器 || this.載入處理器)
  }

  /** 取得載入的特殊檔案資訊 */
  取得特殊檔案資訊(): string[] {
    const 資訊: string[] = []
    
    if (this.app包裝器) 資訊.push('App')
    if (this.中間件們.length > 0) 資訊.push(`Middleware (${this.中間件們.length})`)
    if (this.layout包裝器) 資訊.push('Layout')
    if (this.錯誤處理器) 資訊.push('Error')
    if (this.載入處理器) 資訊.push('Loading')
    
    return 資訊
  }
}
