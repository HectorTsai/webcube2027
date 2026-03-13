#!/usr/bin/env deno run --allow-net --allow-read --allow-env --allow-write --unstable-kv

import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import { setupFileRouter } from './src/router.ts'

const app = new Hono()

// 設定 JSX 渲染中間件
app.use('*', jsxRenderer())

// 靜態檔案服務
app.get('/uno.css', async (_c) => {
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

// 設定檔案路由
const router = await setupFileRouter(app, {
  routesDir: './src/routes',
  debug: true
})

// 熱加載 WebSocket 端點
app.get('/hot-reload', (c) => {
  const upgradeHeader = c.req.header('upgrade')
  if (upgradeHeader !== 'websocket') {
    return c.text('Please use WebSocket', 400)
  }
  
  const { socket, response } = Deno.upgradeWebSocket(c.req.raw)
  
  console.log('🔥 熱加載客戶端已連接')
  
  socket.onopen = () => {
    socket.send('🔥 WebCube2027 熱加載已啟動')
  }
  
  socket.onclose = () => {
    console.log('🔥 熱加載客戶端已斷開')
  }
  
  socket.onerror = (error) => {
    console.error('🔥 熱加載錯誤:', error)
  }
  
  // 儲存 socket 連接
  if (!(globalThis as any).hotReloadClients) {
    (globalThis as any).hotReloadClients = new Set<WebSocket>()
  }
  (globalThis as any).hotReloadClients.add(socket)
  
  return response
})

// 熱加載觸發函數
function triggerHotReload(message: string) {
  const clients = ((globalThis as any).hotReloadClients as Set<WebSocket>) || new Set()
  
  clients.forEach(socket => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message)
    } else {
      clients.delete(socket)
    }
  })
  
  console.log(`🔥 熱加載觸發: ${message}`)
}

// 檔案監控
const watcher = Deno.watchFs('./src')
const cssWatcher = Deno.watchFs('./public')

console.log('🔥 啟動檔案監控...')

// 監控 TypeScript/JSX 檔案
;(async () => {
  for await (const event of watcher) {
    if (event.kind === 'modify') {
      const filePath = event.paths[0]
      
      // 只監控相關檔案
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        console.log(`📝 檔案變更: ${filePath}`)
        
        // 清除模組快取
        const moduleUrl = `file://${Deno.realPathSync(filePath)}`
        delete (globalThis as any).__deno_core?.ops?.op_fetch_module?.moduleCache?.[moduleUrl]
        
        // 觸發熱加載
        triggerHotReload(`reload:${filePath}`)
        
        // 重新載入路由器 (如果變更的是路由檔案)
        if (filePath.includes('/routes/')) {
          console.log('🔄 重新載入路由器...')
          // 重新設定路由器
          await setupFileRouter(app, {
            routesDir: './src/routes',
            debug: true
          })
          triggerHotReload('routes:updated')
        }
        
        // 重新載入元件 (如果變更的是元件檔案)
        if (filePath.includes('/components/')) {
          console.log('🔄 重新載入元件...')
          triggerHotReload('components:updated')
        }
      }
    }
  }
})()

// 監控 CSS 檔案
;(async () => {
  for await (const event of cssWatcher) {
    if (event.kind === 'modify' && event.paths[0].endsWith('.css')) {
      console.log(`🎨 CSS 檔案變更: ${event.paths[0]}`)
      triggerHotReload('css:updated')
    }
  }
})()

// 啟動伺服器
const port = 8000
console.log(`🚀 WebCube2027 開發伺服器啟動於 http://localhost:${port}`)
console.log(`🔥 熱加載已啟動 - WebSocket: ws://localhost:${port}/hot-reload`)

Deno.serve({ port }, app.fetch)
