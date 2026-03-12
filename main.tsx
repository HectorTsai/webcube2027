import { Hono } from 'hono'
import { setupFileRouter } from './src/router.ts'

const app = new Hono()

// 靜態檔案服務
app.get('/uno.css', async (c) => {
  const css = await Deno.readTextFile('./public/uno.css')
  return new Response(css, {
    headers: { 'Content-Type': 'text/css' }
  })
})

app.get('/static/*', async (c) => {
  const path = c.req.path.replace('/static', '')
  try {
    const content = await Deno.readFile(`./public${path}`)
    const ext = path.split('.').pop()
    const contentType = ext === 'css' ? 'text/css' : 
                      ext === 'js' ? 'application/javascript' : 
                      'text/plain'
    return new Response(content, {
      headers: { 'Content-Type': contentType }
    })
  } catch {
    return c.text('Not found', 404)
  }
})

// 設定檔案路由器
await setupFileRouter(app, {
  routesDir: 'src/routes',
  debug: true
})

// 健康檢查
app.get('/health', (c) => c.text('ok'))

Deno.serve(app.fetch)
