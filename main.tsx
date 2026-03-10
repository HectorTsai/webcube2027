import { Hono } from 'hono'
import { serveStatic } from 'hono/deno'

import { 檔案路由器 } from './src/router/mod.ts'
import { 註冊路由 } from './src/router/hono-integration.ts'

const app = new Hono()

// 靜態檔案服務
app.use('/uno.css', serveStatic({ path: './public/uno.css' }))

// 建立檔案路由器
const 路由器 = new 檔案路由器({
  掃描目錄: 'src/routes',
  監看: true, // 監看檔案變更
})

// 初始化路由器
await 路由器.初始化()

// 批次註冊路由（包含特殊檔案處理）
await 註冊路由(app, 路由器, {
  前綴: '', // 空前綴
  除錯: true, // 啟用除錯模式
})

// 除錯路由：查看所有路由
app.get('/_routes', (c) => {
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

// 健康檢查
app.get('/health', (c) => c.text('ok'))

Deno.serve(app.fetch)
