import type { Context } from 'hono'
import 風格 from '@/database/models/風格.ts'

export default async function StyleAPI(ctx: Context) {
  const style = ctx.req.param('style')
  const sysDb = ctx.get('系統資料庫') as any

  console.log(`[API] 取得風格詳細資訊: ${style}`)

  try {
    let 風格資料: any = null
    
    // 從系統資料庫取得風格資料
    if (sysDb) {
      try {
        const result = await sysDb.查詢(`SELECT * FROM 風格 WHERE id = '${style}'`)
        console.log(`[API] 系統資料庫風格查詢結果:`, result)
        
        if (result && result.length > 0) {
          風格資料 = result[0]
        }
      } catch (error) {
        console.log(`[API] 從系統資料庫取得風格 ${style} 失敗:`, error)
      }
    } else {
      console.log('[API] 系統資料庫未連線')
    }

    // 如果沒有找到風格，檢查是否為預設風格
    if (!風格資料) {
      風格資料 = 風格.預設風格[style as keyof typeof 風格.預設風格]
      
      if (!風格資料) {
        return ctx.json({
          成功: false,
          錯誤: `找不到風格: ${style}`,
          可用風格: 風格.預設風格ID列表,
          說明: '請使用有效的風格 ID'
        }, 404)
      }
    }

    // 取得該風格的元件列表
    let 元件列表: any[] = []
    
    // 從系統資料庫取得元件
    if (sysDb) {
      try {
        const result = await sysDb.查詢(`SELECT * FROM 元件 WHERE 風格 = '${style}'`)
        console.log(`[API] 系統資料庫元件查詢結果:`, result)
        
        if (result && result.length > 0) {
          元件列表 = result
        }
      } catch (error) {
        console.log(`[API] 從系統資料庫取得 ${style} 元件失敗:`, error)
      }
    }

    return ctx.json({
      成功: true,
      風格: 風格資料,
      style: style,
      元件列表: 元件列表,
      元件數量: 元件列表.length,
      說明: 風格資料.來源 === '系統資料庫' 
        ? `從系統資料庫取得風格 ${style}`
        : `使用預設風格 ${style}（系統資料庫未連線或無資料）`
    })

  } catch (error) {
    console.error(`[API] 取得風格 ${style} 資料失敗:`, error)
    
    return ctx.json({
      成功: false,
      錯誤: '取得風格資料失敗',
      風格: style
    }, 500)
  }
}
