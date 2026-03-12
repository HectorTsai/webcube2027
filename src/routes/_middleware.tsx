import type { Context, Next } from 'hono'
import { KV資料庫 } from '../database/kv.ts'
import { Surreal資料庫 } from '../database/surrealdb.ts'
import 系統資訊 from '../database/models/系統資訊.ts'
import 網站資訊 from '../database/models/網站資訊.ts'
import 骨架 from '../database/models/骨架.ts'
import 配色 from '../database/models/配色.ts'
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@dui/smartmultilingual'

// 全域變數宣告
declare global {
  var sysDb: Surreal資料庫 | undefined
  var kv: KV資料庫 | undefined
  var siteDbs: Record<string, Surreal資料庫> | undefined
}

// 語言解析函數
function parseAcceptLanguage(acceptLanguage: string | undefined): SupportedLanguage {
  if (!acceptLanguage) return 'zh-tw' as SupportedLanguage
  
  // 取得第一個語言，例如 "zh-TW,zh;q=0.9,en;q=0.8" → "zh-TW"
  const firstLang = acceptLanguage.split(',')[0].trim()
  
  // 處理常見格式
  // zh-TW → zh-tw
  // zh_CN → zh-cn  
  // en-US → en
  const normalized = firstLang
    .replace(/-[A-Z]+/g, match => match.toLowerCase()) // zh-TW → zh-tw
    .replace(/_([A-Z]+)/g, (_, p1) => `-${p1.toLowerCase()}`) // zh_CN → zh-cn
    .replace(/_([a-z]+)/g, (_, p1) => `-${p1}`) // zh_cn → zh-cn
  
  // 檢查是否為支援的語言
  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage
  }
  
  // 如果不支援，嘗試只取主語言部分
  const mainLang = normalized.split('-')[0]
  if (SUPPORTED_LANGUAGES.includes(mainLang as SupportedLanguage)) {
    return mainLang as SupportedLanguage
  }
  
  return 'zh-tw' as SupportedLanguage // 預設語言
}

// 語言解析輔助函數
function 從路徑提取語言(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length > 0) {
    const firstSegment = segments[0]
    if (SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLanguage)) {
      return firstSegment
    }
  }
  return null
}

function 從Cookie取得語言(ctx: Context): string | null {
  const cookieHeader = ctx.req.header('cookie')
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim())
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (name === 'webcube-lang' && value) {
      return value
    }
  }
  return null
}

/** 全域中間件：資料庫初始化與狀態管理 */
export default async function middleware(ctx: Context, next: Next) {
  const uri = new URL(ctx.req.url)
  const { pathname, hostname: host } = uri

  console.log(`[middleware] ${ctx.req.method} ${ctx.req.path}`)
  
  // 設定執行時間追蹤
  ctx.set('startTime', Date.now())

  try {
    // 1. 初始化 KV 資料庫（單例）
    if (!globalThis.kv) {
      try {
        globalThis.kv = new KV資料庫()
        await globalThis.kv.開啟()
        await globalThis.kv.初始化('系統資訊')
        console.log('[middleware] KV 資料庫初始化成功')
      } catch (error) {
        console.error('[middleware] KV 資料庫初始化失敗:', error)
      }
    }

    // 2. 讀取系統資訊
    let sysInfo: 系統資訊 | null = null
    if (globalThis.kv) {
      try {
        sysInfo = (await globalThis.kv.取得資料<系統資訊>('系統資訊:系統資訊:預設')) as 系統資訊 | null
        if (!sysInfo) {
          console.log('[middleware] 無系統資訊，需要執行 setup')
        }
      } catch (error) {
        console.error('[middleware] 讀取系統資訊失敗:', error)
      }
    }

    // 3. 初始化系統資料庫（單例）
    if (!globalThis.sysDb && sysInfo && sysInfo.資料庫) {
      try {
        const dbText = await sysInfo.資料庫.getPlainText()
        if (dbText) {
          const settings = JSON.parse(dbText)
          globalThis.sysDb = new Surreal資料庫(settings)
          await globalThis.sysDb.登入()
          globalThis.sysDb.初始化("語言")
          globalThis.sysDb.初始化("單字")
          globalThis.sysDb.初始化("圖示")
          globalThis.sysDb.初始化("配色")
          globalThis.sysDb.初始化("骨架")
          globalThis.sysDb.初始化("佈景主題")
          console.log('[middleware] 系統資料庫初始化成功')
        }
      } catch (error) {
        console.error('[middleware] 系統資料庫初始化失敗:', error)
      }
    }

    // 4. 初始化網站資料庫記錄（單例 Record）
    if (!globalThis.siteDbs) {
      globalThis.siteDbs = {}
    }

    // 5. 獲取網站資訊
    let siteInfo: 網站資訊 | null = null
    if (globalThis.sysDb) {
      try {
        const siteInfoQuery = await globalThis.sysDb?.查詢(`SELECT * FROM 網站資訊 WHERE 網址 = '${host}'`)
        siteInfo = siteInfoQuery && siteInfoQuery.length > 0 ? new 網站資訊(siteInfoQuery[0] as Record<string, unknown>) : null
      } catch (error) {
        console.error('[middleware] 查詢網站資訊失敗:', error)
      }
    }

    // 6. 獲取或初始化網站資料庫
    let siteDb: Surreal資料庫 | null = globalThis.siteDbs?.[host] || null
    if (!globalThis.siteDbs?.[host] && siteInfo && siteInfo.資料庫) {
      try {
        const dbText = siteInfo.資料庫.getPlainText()
        if (dbText) {
          const settings = JSON.parse(dbText)
          siteDb = new Surreal資料庫(settings)
          await siteDb.登入()
          if (globalThis.siteDbs) {
            globalThis.siteDbs[host] = siteDb
          }
          console.log(`[middleware] 網站資料庫初始化成功 (${host})`)
        }
      } catch (error) {
        console.error(`[middleware] 網站資料庫初始化失敗 (${host}):`, error)
      }
    }

    // 7. 語言解析
    // 語言優先順序：URL > Cookie > Accept-Language
    const pathLang = 從路徑提取語言(pathname)
    let lang: SupportedLanguage
    
    if (pathLang && SUPPORTED_LANGUAGES.includes(pathLang as SupportedLanguage)) {
      lang = pathLang as SupportedLanguage
      console.log(`[middleware] 從路徑取得語言: ${lang}`)
    } else {
      const cookieLang = 從Cookie取得語言(ctx)
      if (cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang as SupportedLanguage)) {
        lang = cookieLang as SupportedLanguage
        console.log(`[middleware] 從 Cookie 取得語言: ${lang}`)
      } else {
        const acceptLanguage = ctx.req.header('accept-language')
        lang = parseAcceptLanguage(acceptLanguage)
        console.log(`[middleware] 從 accept-language 取得語言: ${lang}`)
      }
    }

    // 設定語言到 Cookie
    ctx.header('Set-Cookie', `webcube-lang=${lang}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`)

    // 8. 載入網站資料（骨架、配色、佈景主題）
    let 骨架資料: 骨架 | null = null
    let 配色資料: 配色 | null = null
    let 佈景主題資料: Record<string, unknown> | null = null

    if (!siteInfo) {
      // 使用預設資料 - 給系統管理者第一次看
      骨架資料 = new 骨架()
      配色資料 = new 配色()
      console.log('[middleware] 使用預設資料')
    } else {
      // 有網站資訊時，按照優先順序載入資料
      try {
        // 優先載入單獨設定的骨架和配色
        if (siteInfo.骨架ID) {
          const 骨架Query = await globalThis.sysDb?.查詢(`SELECT * FROM 骨架 WHERE id = ${siteInfo.骨架ID}`)
          骨架資料 = 骨架Query && 骨架Query.length > 0 ? new 骨架(骨架Query[0] as Record<string, unknown>) : null
        }
        
        if (siteInfo.配色ID) {
          const 配色Query = await globalThis.sysDb?.查詢(`SELECT * FROM 配色 WHERE id = ${siteInfo.配色ID}`)
          配色資料 = 配色Query && 配色Query.length > 0 ? new 配色(配色Query[0] as Record<string, unknown>) : null
        }
        
        // 如果骨架或配色還沒有值，才從佈景主題載入
        if (!骨架資料 || !配色資料) {
          if (siteInfo.佈景主題ID) {
            const 佈景主題Query = await globalThis.sysDb?.查詢(`SELECT * FROM 佈景主題 WHERE id = ${siteInfo.佈景主題ID}`)
            佈景主題資料 = 佈景主題Query && 佈景主題Query.length > 0 ? 佈景主題Query[0] as Record<string, unknown> : null
            
            // 從佈景主題補載缺少的資料
            if (佈景主題資料) {
              if (!骨架資料 && 佈景主題資料.骨架ID) {
                const 骨架Query = await globalThis.sysDb?.查詢(`SELECT * FROM 骨架 WHERE id = ${佈景主題資料.骨架ID}`)
                骨架資料 = 骨架Query && 骨架Query.length > 0 ? new 骨架(骨架Query[0] as Record<string, unknown>) : null
              }
              
              if (!配色資料 && 佈景主題資料.配色ID) {
                const 配色Query = await globalThis.sysDb?.查詢(`SELECT * FROM 配色 WHERE id = ${佈景主題資料.配色ID}`)
                配色資料 = 配色Query && 配色Query.length > 0 ? new 配色(配色Query[0] as Record<string, unknown>) : null
              }
            }
          }
        }
      } catch (error) {
        console.error('[middleware] 載入網站資料失敗:', error)
      }
    }

    // 9. 設定 Context 狀態
    ctx.set('host', host)
    ctx.set('pathname', pathname)
    ctx.set('語言', lang)
    ctx.set('系統資料庫', globalThis.sysDb)
    ctx.set('網站資料庫', siteDb)
    ctx.set('網站資訊', siteInfo)
    ctx.set('系統資訊', sysInfo)
    ctx.set('骨架資料', 骨架資料)
    ctx.set('配色資料', 配色資料)
    ctx.set('佈景主題資料', 佈景主題資料)

    console.log(`[middleware] 狀態設定完成 - 語言: ${lang}, 網站: ${siteInfo?.名稱 || '預設'}`)

  } catch (error) {
    console.error('[middleware] 初始化過程發生錯誤:', error)
  }

  // 繼續執行下一個中間件或路由
  await next()
  
  // 計算執行時間
  const duration = Date.now() - ctx.get('startTime')
  console.log(`[middleware] Completed in ${duration}ms`)
}
