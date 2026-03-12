import { Context } from "hono";
import { Surreal資料庫 } from "@/database/surrealdb.ts";
import 圖示 from "@/database/models/圖示.ts";

export default async function IconAPI(ctx: Context) {
  // 手動提取 URL 參數，因為這個路由器沒有自動設定 ctx.param
  const path = ctx.req.path
  const id = path.split('/').pop() || ''
  
  // 取得使用者語言
  const userLang = ctx.get('語言') as string
  
  // 1. 優先使用網站資料庫
  const siteDb = ctx.get('網站資料庫') as Surreal資料庫 | null
  if (siteDb) {
    try {
      const result = await siteDb.查詢(`SELECT * FROM 圖示 WHERE id = '${id}'`)
      if (result && result.length > 0) {
        const icon = new 圖示(result[0] as Record<string, unknown>)
        return ctx.json({
          內容: icon.資料.資料,
          格式: icon.資料.格式,
          名稱: icon.名稱.取得(userLang)
        })
      }
    } catch (error) {
      console.log(`[API] 圖示 ${id} 從網站資料庫取得失敗:`, error)
    }
  }
  
  // 2. 嘗試系統資料庫
  const sysDb = ctx.get('系統資料庫') as Surreal資料庫 | null
  if (sysDb) {
    try {
      const result = await sysDb.查詢(`SELECT * FROM 圖示 WHERE id = '${id}'`)
      if (result && result.length > 0) {
        const icon = new 圖示(result[0] as Record<string, unknown>)
        return ctx.json({
          內容: icon.資料.資料,
          格式: icon.資料.格式,
          名稱: icon.名稱.取得(userLang)
        })
      }
    } catch (error) {
      console.log(`[API] 圖示 ${id} 從系統資料庫取得失敗:`, error)
    }
  }
  
  // 3. 如果兩個資料庫都沒有，從檔案系統讀取靜態圖示
  try {
    // API ID 到檔名的映射
    const idToFileMap: Record<string, string> = {
      '圖示:圖示:spinner': 'spinner',
      '圖示:圖示:cube': 'cube',
      '圖示:圖示:home': 'home',
      '圖示:圖示:user': 'user',
      '圖示:圖示:settings': 'settings'
    }
    
    const 檔名 = idToFileMap[id] || id // 如果沒有映射，直接使用 ID
    const 圖示檔案路徑 = `${Deno.cwd()}/images/${檔名}.svg`
    const 內容 = await Deno.readTextFile(圖示檔案路徑)
    
    return ctx.json({
      內容: 內容,
      格式: 'SVG',
      名稱: 檔名 // 使用檔名作為名稱
    })
  } catch (error) {
    console.log(`[API] 圖示 ${id} 從檔案系統讀取失敗:`, error)
  }
  
  // 4. 最終後備 - 基本的載入動畫
  const fallbackNames = {
    'zh-tw': '預設載入動畫',
    'en': 'Default Loading Animation',
    'vi': 'Hoạt ảnh tải mặc định'
  }
  return ctx.json({
    內容: '<div class="animate-spin w-6 h-6 border-2 border-current rounded-full border-t-transparent"></div>',
    格式: 'HTML',
    名稱: fallbackNames[userLang as keyof typeof fallbackNames] || '預設載入動畫'
  })
}
