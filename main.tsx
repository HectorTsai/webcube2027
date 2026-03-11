import { Hono } from 'hono'
import { setupFileRouter } from './src/router.ts'

const app = new Hono()

// 設定檔案路由器
await setupFileRouter(app, {
  routesDir: 'src/routes',
  debug: true
})

// 健康檢查
app.get('/health', (c) => c.text('ok'))

Deno.serve(app.fetch)
