import type { Context } from 'hono'

export default async function ThemesAPI(ctx: Context) {
  const sysDb = ctx.get('系統資料庫') as any

  try {
    // 取得所有佈景主題
    const 佈景主題列表: any[] = []
    
    // 從系統資料庫取得佈景主題
    if (sysDb) {
      try {
        const result = await sysDb.查詢('SELECT * FROM 佈景主題')
        console.log('[API] 系統資料庫佈景主題查詢結果:', result)
        
        if (result && result.length > 0) {
          result.forEach((item: any) => {
            佈景主題列表.push({
              id: item.id,
              名稱: item.名稱,
              描述: item.描述,
              骨架ID: item.骨架ID,
              配色ID: item.配色ID,
              版本: item.版本,
              狀態: item.狀態,
              來源: '系統資料庫'
            })
          })
        }
      } catch (error) {
        console.log('[API] 從系統資料庫取得佈景主題失敗:', error)
      }
    }

    // 如果沒有佈景主題，加入預設佈景主題
    if (佈景主題列表.length === 0) {
      console.log('[API] 加入預設佈景主題')
      佈景主題列表.push({
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
        骨架ID: '骨架:骨架:經典',
        配色ID: '配色:預設:經典藍',
        版本: '1.0.0',
        狀態: '啟用',
        來源: '預設'
      })
    }

    return ctx.json({
      成功: true,
      佈景主題列表: 佈景主題列表,
      總數: 佈景主題列表.length,
      說明: 佈景主題列表.some((t: any) => t.來源 === '系統資料庫')
        ? `從系統資料庫找到 ${佈景主題列表.filter((t: any) => t.來源 === '系統資料庫').length} 個佈景主題`
        : '使用預設佈景主題（系統資料庫未連線或無資料）'
    })

  } catch (error) {
    console.error('[API] 取得佈景主題列表失敗:', error)
    
    // 發生錯誤時直接傳回預設佈景主題
    return ctx.json({
      成功: true,
      佈景主題列表: [{
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
        骨架ID: '骨架:骨架:經典',
        配色ID: '配色:預設:經典藍',
        版本: '1.0.0',
        狀態: '啟用',
        來源: '預設'
      }],
      總數: 1,
      說明: '發生錯誤，使用預設佈景主題'
    })
  }
}
