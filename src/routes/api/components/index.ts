import type { Context } from 'hono'
import 風格 from '@/database/models/風格.ts'

export default async function ComponentsAPI(ctx: Context) {
  const sysDb = ctx.get('系統資料庫') as any

  try {
    // 取得所有風格
    const 風格列表: any[] = []
    
    // 從系統資料庫取得風格
    if (sysDb) {
      try {
        const result = await sysDb.查詢('SELECT * FROM 風格')
        console.log('[API] 系統資料庫風格查詢結果:', result)
        
        if (result && result.length > 0) {
          result.forEach((item: any) => {
            風格列表.push({
              id: item.id,
              名稱: item.名稱,
              描述: item.描述,
              版本: item.版本,
              來源: '系統資料庫'
            })
          })
        }
      } catch (error) {
        console.log('[API] 從系統資料庫取得風格失敗:', error)
      }
    } else {
      console.log('[API] 系統資料庫未連線')
    }

    // 如果沒有風格，加入預設風格
    if (風格列表.length === 0) {
      console.log('[API] 加入預設風格')
      風格列表.push(...風格.預設風格列表)
    }

    return ctx.json({
      成功: true,
      風格列表: 風格列表,
      總數: 風格列表.length,
      說明: 風格列表.some((s: any) => s.來源 === '系統資料庫')
        ? `從系統資料庫找到 ${風格列表.filter((s: any) => s.來源 === '系統資料庫').length} 個風格`
        : '使用預設風格（系統資料庫未連線或無資料）'
    })

  } catch (error) {
    console.error('[API] 取得風格列表失敗:', error)
    
    return ctx.json({
      成功: false,
      錯誤: '取得風格列表失敗',
      風格列表: [],
      總數: 0
    })
  }
}
