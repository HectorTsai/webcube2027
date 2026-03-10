import type { Context, Next } from 'hono'

/** 全域中間件：在所有路由執行前運行 */
export default async function 全域中間件(ctx: Context, next: Next) {
  console.log(`[middleware] ${ctx.req.method} ${ctx.req.path}`)
  
  // 設定全域變數
  ctx.set('startTime', Date.now())
  
  // 繼續執行下一個中間件或路由
  await next()
  
  // 計算執行時間
  const duration = Date.now() - ctx.get('startTime')
  console.log(`[middleware] Completed in ${duration}ms`)
}
