import type { Context } from 'hono'
import 骨架 from '@/database/models/骨架.ts'

export default async function SkeletonsAPI(ctx: Context) {
  const sysDb = ctx.get('系統資料庫') as any

  try {
    // 取得所有骨架
    const 骨架列表: any[] = []
    
    // 從系統資料庫取得骨架
    if (sysDb) {
      try {
        const result = await sysDb.查詢('SELECT * FROM 骨架')
        console.log('[API] 系統資料庫骨架查詢結果:', result)
        
        if (result && result.length > 0) {
          result.forEach((item: any) => {
            const skeleton = new 骨架(item)
            const skeletonData = skeleton.toJSON()
            skeletonData.來源 = '系統資料庫'
            骨架列表.push(skeletonData)
          })
        }
      } catch (error) {
        console.log('[API] 從系統資料庫取得骨架失敗:', error)
      }
    }

    // 如果沒有骨架，加入預設骨架
    if (骨架列表.length === 0) {
      console.log('[API] 加入預設骨架')
      const defaultSkeleton = new 骨架()
      const defaultData = defaultSkeleton.toJSON()
      defaultData.來源 = '預設'
      骨架列表.push(defaultData)
    }

    return ctx.json({
      成功: true,
      骨架列表: 骨架列表,
      總數: 骨架列表.length,
      說明: 骨架列表.some((s: any) => s.來源 === '系統資料庫')
        ? `從系統資料庫找到 ${骨架列表.filter((s: any) => s.來源 === '系統資料庫').length} 個骨架`
        : '使用預設骨架（系統資料庫未連線或無資料）'
    })

  } catch (error) {
    console.error('[API] 取得骨架列表失敗:', error)
    
    // 發生錯誤時直接傳回預設骨架
    const defaultSkeleton = new 骨架()
    const defaultData = defaultSkeleton.toJSON()
    defaultData.來源 = '預設'
    
    return ctx.json({
      成功: true,
      骨架列表: [defaultData],
      總數: 1,
      說明: '發生錯誤，使用預設骨架'
    })
  }
}
