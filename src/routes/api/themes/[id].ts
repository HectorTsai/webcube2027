import type { Context } from 'hono'
import 骨架 from '@/database/models/骨架.ts'
import 配色 from '@/database/models/配色.ts'

export default async function ThemeAPI(ctx: Context) {
  const { id } = ctx.req.param()
  const sysDb = ctx.get('系統資料庫') as any

  try {
    let theme = null
    let source = '預設'
    
    // 從系統資料庫取得特定佈景主題
    if (sysDb) {
      try {
        // 第一層：直接查詢指定佈景主題
        const result = await sysDb.查詢(`SELECT * FROM 佈景主題 WHERE id = '${id}'`)
        console.log('[API] 系統資料庫佈景主題查詢結果:', result)
        
        if (result && result.length > 0) {
          theme = result[0]
          source = '系統資料庫'
        } else {
          // 第二層：嘗試從骨架或配色反向查找佈景主題
          const skeletonResult = await sysDb.查詢(`SELECT * FROM 骨架 WHERE id = '${id}'`)
          const colorResult = await sysDb.查詢(`SELECT * FROM 配色 WHERE id = '${id}'`)
          
          if (skeletonResult && skeletonResult.length > 0) {
            // 查找包含此骨架的佈景主題
            const themeFromSkeleton = await sysDb.查詢(`SELECT * FROM 佈景主題 WHERE 骨架 = '${id}'`)
            if (themeFromSkeleton && themeFromSkeleton.length > 0) {
              theme = themeFromSkeleton[0]
              source = '骨架關聯'
            }
          } else if (colorResult && colorResult.length > 0) {
            // 查找包含此配色的佈景主題
            const themeFromColor = await sysDb.查詢(`SELECT * FROM 佈景主題 WHERE 配色 = '${id}'`)
            if (themeFromColor && themeFromColor.length > 0) {
              theme = themeFromColor[0]
              source = '配色關聯'
            }
          }
        }
      } catch (error) {
        console.log('[API] 從系統資料庫取得佈景主題失敗:', error)
      }
    }

    // 第三層：如果都沒有找到，使用預設佈景主題
    if (!theme) {
      console.log('[API] 使用預設佈景主題')
      theme = {
        id: '佈景主題:預設:經典',
        名稱: {
          en: 'Classic Theme',
          'zh-tw': '經典佈景主題',
          vi: 'Chủ đề Cổ điển'
        },
        描述: {
          en: 'Classic theme with traditional layout and blue color scheme',
          'zh-tw': '經典佈景主題，傳統佈局搭配藍色配色',
          vi: 'Chủ đề cổ điển với bố cục truyền thống và màu xanh'
        },
        骨架: '骨架:骨架:經典',
        配色: '配色:配色:經典藍',
        版本: '1.0.0',
        狀態: '啟用'
      }
      source = '預設'
    }

    // 取得相關的骨架和配色
    let skeleton = null
    let color = null

    if (theme.骨架 && sysDb) {
      try {
        const skeletonResult = await sysDb.查詢(`SELECT * FROM 骨架 WHERE id = '${theme.骨架}'`)
        if (skeletonResult && skeletonResult.length > 0) {
          skeleton = new 骨架(skeletonResult[0])
        }
      } catch (error) {
        console.log('[API] 取得佈景主題相關骨架失敗:', error)
      }
    }

    if (theme.配色 && sysDb) {
      try {
        const colorResult = await sysDb.查詢(`SELECT * FROM 配色 WHERE id = '${theme.配色}'`)
        if (colorResult && colorResult.length > 0) {
          color = new 配色(colorResult[0])
        }
      } catch (error) {
        console.log('[API] 取得佈景主題相關配色失敗:', error)
      }
    }

    // 如果沒有找到相關資料，使用預設值
    if (!skeleton) skeleton = new 骨架()
    if (!color) color = new 配色()

    const themeData = {
      id: theme.id,
      名稱: theme.名稱,
      描述: theme.描述,
      骨架: theme.骨架,
      配色: theme.配色,
      版本: theme.版本,
      狀態: theme.狀態,
      來源: source
    }
    
    return ctx.json({
      成功: true,
      佈景主題: themeData,
      骨架: skeleton ? skeleton.toJSON() : null,
      配色: color ? color.toJSON() : null
    })

  } catch (error) {
    console.error('[API] 取得佈景主題失敗:', error)
    
    // 發生錯誤時直接傳回預設佈景主題
    const defaultSkeleton = new 骨架()
    const defaultColor = new 配色()
    
    return ctx.json({
      成功: true,
      佈景主題: {
        id: '佈景主題:預設:經典',
        名稱: {
          en: 'Classic Theme',
          'zh-tw': '經典佈景主題',
          vi: 'Chủ đề Cổ điển'
        },
        描述: {
          en: 'Classic theme with traditional layout and blue color scheme',
          'zh-tw': '經典佈景主題，傳統佈局搭配藍色配色',
          vi: 'Chủ đề cổ điển với bố cục truyền thống và màu xanh'
        },
        骨架: '骨架:骨架:經典',
        配色: '配色:配色:經典藍',
        版本: '1.0.0',
        狀態: '啟用',
        來源: '預設'
      },
      骨架: defaultSkeleton.toJSON(),
      配色: defaultColor.toJSON(),
      說明: '發生錯誤，使用預設佈景主題'
    })
  }
}
