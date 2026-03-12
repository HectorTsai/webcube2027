import type { Context } from 'hono'
import 風格 from '@/database/models/風格.ts'

export default async function ComponentAPI(ctx: Context) {
  const style = ctx.req.param('style')
  const id = ctx.req.param('id')

  console.log(`[API] 取得元件詳細內容: ${style}/${id}`)

  try {
    // 直接從檔案系統讀取元件
    const 元件資料 = await 取得元件檔案(style || '', id || '')

    if (!元件資料) {
      return ctx.json({
        成功: false,
        錯誤: `找不到元件: ${style}/${id}`,
        說明: '請檢查風格和元件 ID 是否正確',
        可用風格: 風格.預設風格ID列表
      }, 404)
    }

    return ctx.json({
      成功: true,
      風格: style,
      id: id,
      元件: 元件資料,
      說明: `從檔案系統取得元件 ${style}/${id}`
    })

  } catch (error) {
    console.error(`[API] 取得元件 ${style}/${id} 失敗:`, error)
    
    return ctx.json({
      成功: false,
      錯誤: '取得元件失敗',
      風格: style,
      id: id
    }, 500)
  }
}

// 從檔案系統讀取元件
async function 取得元件檔案(風格: string, id: string): Promise<any> {
  const 檔案路徑 = `${Deno.cwd()}/src/components/${風格}/${id}.tsx`
  
  try {
    const 代碼 = await Deno.readTextFile(檔案路徑)
    
    // 基本元件資訊
    const 元件資料 = {
      id: id,
      風格: 風格,
      類型: '元件',
      名稱: `${風格}${id}`,
      描述: `${風格}風格的${id}元件`,
      代碼: 代碼,
      檔案路徑: 檔案路徑,
      來源: '檔案系統'
    }

    console.log(`[API] 成功讀取元件檔案: ${檔案路徑}`)
    return 元件資料

  } catch (error) {
    console.log(`[API] 讀取元件檔案失敗: ${檔案路徑}`, error)
    return null
  }
}
