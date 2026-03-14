import type { Context } from 'hono'
import 配色 from '@/database/models/配色.ts'

export default async function ColorsAPI(ctx: Context) {
  const sysDb = ctx.get('系統資料庫') as any

  try {
    // 取得所有配色
    const 配色列表: any[] = []
    
    // 從系統資料庫取得配色
    if (sysDb) {
      try {
        const result = await sysDb.查詢('SELECT * FROM 配色')
        console.log('[API] 系統資料庫配色查詢結果:', result)
        
        if (result && result.length > 0) {
          result.forEach((item: any) => {
            const color = new 配色(item)
            const colorData = color.toJSON()
            colorData.來源 = '系統資料庫'
            配色列表.push(colorData)
          })
        }
      } catch (error) {
        console.log('[API] 從系統資料庫取得配色失敗:', error)
      }
    }

    // 如果沒有配色，加入預設配色
    if (配色列表.length === 0) {
      console.log('[API] 加入預設配色')
      const defaultColor = new 配色()
      const defaultData = defaultColor.toJSON()
      defaultData.來源 = '預設'
      配色列表.push(defaultData)
    }

    return ctx.json({
      成功: true,
      配色列表: 配色列表,
      總數: 配色列表.length,
      說明: 配色列表.some((c: any) => c.來源 === '系統資料庫')
        ? `從系統資料庫找到 ${配色列表.filter((c: any) => c.來源 === '系統資料庫').length} 個配色`
        : '使用預設配色（系統資料庫未連線或無資料）'
    })

  } catch (error) {
    console.error('[API] 取得配色列表失敗:', error)
    
    // 發生錯誤時直接傳回預設配色
    const defaultColor = new 配色()
    const defaultData = defaultColor.toJSON()
    defaultData.來源 = '預設'
    
    return ctx.json({
      成功: true,
      配色列表: [defaultData],
      總數: 1,
      說明: '發生錯誤，使用預設配色'
    })
  }
}
