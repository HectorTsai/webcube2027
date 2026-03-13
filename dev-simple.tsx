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

// 熱加載檢查端點
app.get('/hot-reload-check', (c) => {
  return c.json({ 
    status: 'active',
    timestamp: Date.now(),
    message: '熱加載系統運行中'
  })
})

// 設定檔案路由
await setupFileRouter(app, {
  routesDir: './src/routes',
  debug: true
})

// 檔案監控 - 簡化版本
console.log('🔥 啟動簡化版熱加載監控...')

const watcher = Deno.watchFs('./src')

// 儲存最後修改時間
const lastModified = new Map<string, number>()

;(async () => {
  for await (const event of watcher) {
    if (event.kind === 'modify') {
      for (const filePath of event.paths) {
        // 只監控相關檔案
        if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
          try {
            const stat = await Deno.stat(filePath)
            const currentModified = stat.mtime?.getTime() || 0
            const previousModified = lastModified.get(filePath) || 0
            
            // 避免重複觸發
            if (currentModified - previousModified > 100) {
              console.log(`📝 檔案變更: ${filePath}`)
              lastModified.set(filePath, currentModified)
              
              // 簡單的重新載入邏輯
              console.log('🔄 檔案已變更，請重新整理瀏覽器查看變更')
              
              // 可選：發送系統通知
              if (Deno.build.os === 'darwin') {
                try {
                  const command = new Deno.Command('osascript', {
                    args: ['-e', `display notification "檔案已變更: ${filePath}" with title "WebCube2027 熱加載"`]
                  })
                  await command.output()
                } catch (_e) {
                  // 忽略通知錯誤
                }
              }
            }
          } catch (error) {
            console.error(`監控檔案錯誤: ${filePath}`, error)
          }
        }
      }
    }
  }
})()

// 啟動伺服器
const port = 8000
console.log(`🚀 WebCube2027 開發伺服器啟動於 http://localhost:${port}`)
console.log(`🔥 簡化版熱加載已啟動`)
console.log(`💡 提示: 修改檔案後請重新整理瀏覽器查看變更`)
console.log(`🔍 熱加載檢查: http://localhost:${port}/hot-reload-check`)

Deno.serve({ port }, app.fetch)
