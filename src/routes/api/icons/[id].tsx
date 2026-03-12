import { Context } from "hono";
import { Surreal資料庫 } from "../../../../database/surrealdb.ts";
import 圖示 from "../../../../database/models/圖示.ts";

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
  
  // 3. 如果兩個資料庫都沒有，使用預設圖示
  const staticIcons = {
    '圖示:圖示:spinner': {
      內容: '<svg viewBox="0 0 40 40" class="animate-spin"><circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round" stroke-dasharray="80 100" opacity="0.3"/><circle cx="20" cy="20" r="16" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-dasharray="20 100"/></svg>',
      格式: 'SVG',
      名稱: {
        'zh-tw': '轉圈載入動畫',
        'en': 'Spinner Loading',
        'vi': 'Đang tải xoay tròn'
      }
    },
    'webcube:logo': {
      內容: '<svg viewBox="0 0 48 48" fill="none"><rect x="4" y="4" width="40" height="40" rx="8" fill="currentColor"/><text x="24" y="32" text-anchor="middle" fill="white" font-size="20" font-weight="bold">W</text></svg>',
      格式: 'SVG',
      名稱: {
        'zh-tw': 'WebCube 標誌',
        'en': 'WebCube Logo',
        'vi': 'Logo WebCube'
      }
    }
  }
  
  const staticIcon = staticIcons[id as keyof typeof staticIcons]
  if (staticIcon) {
    return ctx.json({
      內容: staticIcon.內容,
      格式: staticIcon.格式,
      名稱: (staticIcon.名稱 as Record<string, string>)[userLang] || (staticIcon.名稱 as Record<string, string>)['zh-tw'] || (staticIcon.名稱 as Record<string, string>)['en']
    })
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
