import type { Context } from 'hono'
import 骨架 from '@/database/models/骨架.ts'

export default async function SkeletonAPI(ctx: Context) {
  const { id } = ctx.req.param()
  const sysDb = ctx.get('系統資料庫') as any

  try {
    let skeleton = null
    let source = '預設'
    
    // 從系統資料庫取得特定骨架
    if (sysDb) {
      try {
        // 第一層：直接查詢指定骨架
        const result = await sysDb.查詢(`SELECT * FROM 骨架 WHERE id = '${id}'`)
        console.log('[API] 系統資料庫骨架查詢結果:', result)
        
        if (result && result.length > 0) {
          skeleton = new 骨架(result[0])
          source = '系統資料庫'
        } else {
          // 第二層：從佈景主題查找骨架
          const themeResult = await sysDb.查詢(`SELECT * FROM 佈景主題 WHERE id = '${id}'`)
          console.log('[API] 從佈景主題查找骨架:', themeResult)
          
          if (themeResult && themeResult.length > 0) {
            const theme = themeResult[0]
            if (theme.骨架) {
              const skeletonResult = await sysDb.查詢(`SELECT * FROM 骨架 WHERE id = '${theme.骨架}'`)
              if (skeletonResult && skeletonResult.length > 0) {
                skeleton = new 骨架(skeletonResult[0])
                source = '佈景主題'
              }
            }
          }
        }
      } catch (error) {
        console.log('[API] 從系統資料庫取得骨架失敗:', error)
      }
    }

    // 第三層：如果都沒有找到，使用預設骨架
    if (!skeleton) {
      console.log('[API] 使用預設骨架')
      skeleton = new 骨架()
      source = '預設'
    }

    const skeletonData = skeleton.toJSON()
    skeletonData.來源 = source
    
    return ctx.json({
      成功: true,
      骨架: skeletonData
    })

  } catch (error) {
    console.error('[API] 取得骨架失敗:', error)
    
    // 發生錯誤時直接傳回預設骨架
    const defaultSkeleton = new 骨架()
    const defaultData = defaultSkeleton.toJSON()
    defaultData.來源 = '預設'
    
    return ctx.json({
      成功: true,
      骨架: defaultData,
      說明: '發生錯誤，使用預設骨架'
    })
  }
}
