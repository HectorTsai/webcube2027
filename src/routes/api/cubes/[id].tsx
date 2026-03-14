// API 端點 - 取得特定方塊資訊

import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS 設定
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// 取得特定方塊
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    
    // 檢查 KV 資料庫是否可用
    if (!globalThis.kv) {
      return c.json({ 
        success: false, 
        error: 'KV 資料庫未初始化' 
      }, 500)
    }
    
    // 從 KV 資料庫讀取方塊
    const 方塊資料 = await globalThis.kv.取得資料(`方塊:基礎:${id}`)
    
    if (!方塊資料) {
      return c.json({ 
        success: false, 
        error: `方塊 ${id} 不存在` 
      }, 404)
    }
    
    // 增加使用次數
    方塊資料.使用次數 += 1
    方塊資料.更新時間 = new Date()
    await globalThis.kv.設定資料(`方塊:基礎:${id}`, 方塊資料)
    
    return c.json({
      success: true,
      方塊: 方塊資料
    })
    
  } catch (error) {
    console.error('[API] 取得方塊失敗:', error)
    return c.json({ 
      success: false, 
      error: '取得方塊失敗',
      詳細: error.message 
    }, 500)
  }
})

// 取得所有方塊清單
app.get('/', async (c) => {
  try {
    // 檢查 KV 資料庫是否可用
    if (!globalThis.kv) {
      return c.json({ 
        success: false, 
        error: 'KV 資料庫未初始化' 
      }, 500)
    }
    
    // 從 KV 資料庫讀取所有方塊
    const 所有方塊 = []
    const 方塊鍵值 = await globalThis.kv.列出鍵值('方塊:基礎:')
    
    for (const 鍵值 of 方塊鍵值) {
      const 方塊資料 = await globalThis.kv.取得資料(`方塊:基礎:${鍵值}`)
      if (方塊資料) {
        所有方塊.push({
          id: 方塊資料.id,
          名稱: 方塊資料.名稱,
          分類: 方塊資料.分類,
          描述: 方塊資料.描述,
          使用次數: 方塊資料.使用次數,
          狀態: 方塊資料.狀態
        })
      }
    }
    
    return c.json({
      success: true,
      方塊清單: 所有方塊,
      總數: 所有方塊.length
    })
    
  } catch (error) {
    console.error('[API] 取得方塊清單失敗:', error)
    return c.json({ 
      success: false, 
      error: '取得方塊清單失敗',
      詳細: error.message 
    }, 500)
  }
})

// 取得可用樣式資源
app.get('/styles/available', async (c) => {
  try {
    // 檢查 KV 資料庫是否可用
    if (!globalThis.kv) {
      return c.json({ 
        success: false, 
        error: 'KV 資料庫未初始化' 
      }, 500)
    }
    
    // 從 KV 資料庫讀取樣式資源
    const 樣式資源 = await globalThis.kv.取得資料('樣式:可用')
    
    if (!樣式資源) {
      return c.json({ 
        success: false, 
        error: '樣式資源不存在' 
      }, 404)
    }
    
    return c.json({
      success: true,
      樣式資源
    })
    
  } catch (error) {
    console.error('[API] 取得樣式資源失敗:', error)
    return c.json({ 
      success: false, 
      error: '取得樣式資源失敗',
      詳細: error.message 
    }, 500)
  }
})

// 按分類取得方塊
app.get('/category/:category', async (c) => {
  try {
    const { category } = c.req.param()
    
    // 檢查 KV 資料庫是否可用
    if (!globalThis.kv) {
      return c.json({ 
        success: false, 
        error: 'KV 資料庫未初始化' 
      }, 500)
    }
    
    // 從 KV 資料庫讀取指定分類的方塊
    const 分類方塊 = []
    const 方塊鍵值 = await globalThis.kv.列出鍵值('方塊:基礎:')
    
    for (const 鍵值 of 方塊鍵值) {
      const 方塊資料 = await globalThis.kv.取得資料(`方塊:基礎:${鍵值}`)
      if (方塊資料 && 方塊資料.分類 === category) {
        分類方塊.push({
          id: 方塊資料.id,
          名稱: 方塊資料.名稱,
          描述: 方塊資料.描述,
          屬性定義: 方塊資料.屬性定義,
          使用次數: 方塊資料.使用次數
        })
      }
    }
    
    return c.json({
      success: true,
      分類,
      方塊: 分類方塊,
      總數: 分類方塊.length
    })
    
  } catch (error) {
    console.error('[API] 取得分類方塊失敗:', error)
    return c.json({ 
      success: false, 
      error: '取得分類方塊失敗',
      詳細: error.message 
    }, 500)
  }
})

export default app
