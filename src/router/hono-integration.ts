/**
 * Hono 整合模組
 * 提供檔案路由器與 Hono 框架的無縫整合
 */

import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { 檔案路由器, 建立路由器, type 路由器選項 } from './mod.ts'
import { 特殊檔案載入器 } from './special-handler.ts'

/** Hono 整合選項 */
export interface Hono整合選項 extends 路由器選項 {
  /** 路由前綴，預設 '/' */
  前綴?: string
  /** 是否啟用除錯模式，預設 false */
  除錯?: boolean
}

/** 路由中間件回傳型別 */
export type 路由中間件 = (ctx: Context, next: Next) => Promise<void | Response>

/**
 * 將檔案路由器整合到 Hono 應用
 * @param app Hono 應用實例
 * @param 選項 整合選項
 * @returns 路由器實例（用於控制生命週期）
 */
export async function 整合檔案路由器(
  app: Hono,
  選項: Hono整合選項 = {}
): Promise<檔案路由器> {
  const { 前綴 = '/', 除錯 = false, ...路由器選項 } = 選項

  // 建立路由器
  const 路由器 = await 建立路由器(路由器選項)

  // 建立路由中間件
  const 中間件 = 建立路由中間件(路由器, { 前綴, 除錯 })

  // 註冊中間件
  app.use(前綴, 中間件)

  if (除錯) {
    // 註冊除錯路由
    app.get(`${前綴}_routes`, (c) => {
      const 所有路由 = 路由器.取得所有路由()
      return c.json({
        路由數量: 所有路由.length,
        路由列表: 所有路由.map(r => ({
          路徑: r.路徑,
          檔案: r.檔案路徑,
          方法: r.方法,
          參數: r.參數,
        })),
      })
    })
  }

  return 路由器
}

/**
 * 建立路由中間件
 * @param 路由器 檔案路由器實例
 * @param 選項 中間件選項
 * @returns Hono 中間件函式
 */
function 建立路由中間件(
  路由器: 檔案路由器,
  選項: { 前綴: string; 除錯: boolean }
): (ctx: Context, next: Next) => Promise<void> {
  return async (ctx: Context, next: Next) => {
    const { 前綴, 除錯 } = 選項
    const 原始路徑 = ctx.req.path
    const 路徑 = 原始路徑.startsWith(前綴) 
      ? 原始路徑.slice(前綴.length - 1) || '/'
      : 原始路徑

    if (除錯) {
      console.log(`[router-middleware] 原始路徑: ${原始路徑}, 處理後路徑: ${路徑}, 前綴: ${前綴}`)
    }

    // 查找路由
    const 路由項目 = 路由器.查找路由(路徑)

    if (除錯) {
      console.log(`[router-middleware] 路徑: ${路徑}, 找到路由: ${路由項目?.路徑 ?? 'null'}`)
    }

    if (路由項目) {
      try {
        // 執行路由處理函式
        const 回應 = await 路由項目.處理函式(ctx)
        // 將回應內容寫入 ctx
        ctx.res = 回應
        return
      } catch (錯誤) {
        console.error(`[router-middleware] 路由執行錯誤 (${路由項目.路徑}):`, 錯誤)
        ctx.res = new Response('Internal Server Error', { status: 500 })
        return
      }
    }

    // 沒有找到路由，繼續下一個中間件
    await next()
  }
}

/**
 * 批次註冊路由（適用於已有路由器實例）
 * @param app Hono 應用實例
 * @param 路由器 檔案路由器實例
 * @param 選項 整合選項
 */
export async function 註冊路由(
  app: Hono,
  路由器: 檔案路由器,
  選項: Pick<Hono整合選項, '前綴' | '除錯'> = {}
): Promise<void> {
  const { 前綴 = '/', 除錯 = false } = 選項

  // 載入特殊檔案
  const 特殊處理器 = new 特殊檔案載入器()
  await 特殊處理器.載入特殊檔案()

  // 取得所有路由並手動註冊
  const 所有路由 = 路由器.取得所有路由()

  for (const 路由項目 of 所有路由) {
    const 完整路徑 = `${前綴}${路由項目.路徑}`.replace(/\/+/g, '/')
    
    // 註冊所有支援的方法
    for (const 方法 of 路由項目.方法) {
      app.on(方法.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE', 完整路徑, async (ctx) => {
        try {
          // 執行路由處理函式，取得 JSX 元素
          const 元素 = await 路由項目.處理函式(ctx)
          
          // 使用特殊檔案包裝器
          const 包裝後元素 = 特殊處理器.有特殊檔案() 
            ? 特殊處理器.包裝頁面組件(元素, ctx)
            : 元素
          
          // 將 JSX 轉換為 HTML Response
          if (typeof 包裝後元素 === 'object' && 包裝後元素 !== null) {
            return ctx.html(包裝後元素 as any)
          }
          
          // 如果是字串，直接回傳
          if (typeof 包裝後元素 === 'string') {
            return ctx.html(包裝後元素)
          }
          
          // 其他情況，轉為字串
          return ctx.html(String(包裝後元素))
        } catch (錯誤) {
          console.error(`[router] 路由執行錯誤 (${完整路徑}):`, 錯誤)
          return ctx.text('Internal Server Error', 500)
        }
      })
    }

    if (除錯) {
      console.log(`[router] 註冊路由: ${路由項目.方法.join(',')} ${完整路徑} -> ${路由項目.檔案路徑}`)
    }
  }

  // 註冊全域中間件
  if (特殊處理器.有特殊檔案()) {
    app.use('*', async (ctx, next) => {
      await 特殊處理器.執行中間件(ctx, next)
    })
    
    if (除錯) {
      console.log('[router] 已註冊全域中間件')
    }
  }

  // 註冊 404 處理
  app.notFound((ctx) => {
    return 特殊處理器.處理404(ctx)
  })

  // 註冊錯誤處理
  app.onError((err, ctx) => {
    return 特殊處理器.處理錯誤(ctx, err)
  })
}

/**
 * 建立路由器工廠（簡化語法）
 * @param app Hono 應用實例
 * @param 目錄 掃描目錄
 * @param 選項 其他選項
 */
export function 使用檔案路由(
  app: Hono,
  目錄 = 'src/routes',
  選項: Omit<Hono整合選項, '掃描目錄'> = {}
): Promise<檔案路由器> {
  return 整合檔案路由器(app, { ...選項, 掃描目錄: 目錄 })
}
