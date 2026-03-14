// 資料庫輔助函數 - 供 API 使用

import { Hono } from 'hono'
import { 骨架 } from '../database/models/骨架.ts'
import { 配色 } from '../database/models/配色.ts'

// 取得網站資訊
export async function getSiteInfo(host: string, sysDb: any) {
  if (!sysDb) return null
  
  try {
    const siteInfoQuery = await sysDb?.查詢(`SELECT * FROM 網站資訊 WHERE 網址 = '${host}'`)
    return siteInfoQuery && siteInfoQuery.length > 0 ? siteInfoQuery[0] : null
  } catch (error) {
    console.error('取得網站資訊失敗:', error)
    return null
  }
}

// 取得系統資訊
export async function getSysInfo(sysDb: any) {
  if (!sysDb) return null
  
  try {
    const sysInfoQuery = await sysDb?.查詢(`SELECT * FROM 系統資訊 WHERE id = '系統資訊:系統資訊:預設'`)
    return sysInfoQuery && sysInfoQuery.length > 0 ? sysInfoQuery[0] : null
  } catch (error) {
    console.error('取得系統資訊失敗:', error)
    return null
  }
}

// 取得骨架資料
export async function getSkeletonData(siteInfo: any, sysDb: any): Promise<骨架 | null> {
  if (!sysDb) return null
  
  try {
    // 優先從網站資訊取得
    if (siteInfo?.骨架) {
      const skeletonQuery = await sysDb?.查詢(`SELECT * FROM 骨架 WHERE id = '${siteInfo.骨架}'`)
      return skeletonQuery && skeletonQuery.length > 0 ? new 骨架(skeletonQuery[0]) : null
    }
    
    // 從佈景主題取得
    if (siteInfo?.佈景主題) {
      const themeQuery = await sysDb?.查詢(`SELECT * FROM 佈景主題 WHERE id = '${siteInfo.佈景主題}'`)
      if (themeQuery && themeQuery.length > 0) {
        const theme = themeQuery[0]
        if (theme.骨架ID) {
          const skeletonQuery = await sysDb?.查詢(`SELECT * FROM 骨架 WHERE id = '${theme.骨架ID}'`)
          return skeletonQuery && skeletonQuery.length > 0 ? new 骨架(skeletonQuery[0]) : null
        }
      }
    }
    
    // 預設骨架
    return new 骨架()
  } catch (error) {
    console.error('取得骨架資料失敗:', error)
    return null
  }
}

// 取得配色資料
export async function getColorData(siteInfo: any, sysDb: any): Promise<配色 | null> {
  if (!sysDb) return null
  
  try {
    // 優先從網站資訊取得
    if (siteInfo?.配色) {
      const colorQuery = await sysDb?.查詢(`SELECT * FROM 配色 WHERE id = '${siteInfo.配色}'`)
      return colorQuery && colorQuery.length > 0 ? new 配色(colorQuery[0]) : null
    }
    
    // 從佈景主題取得
    if (siteInfo?.佈景主題) {
      const themeQuery = await sysDb?.查詢(`SELECT * FROM 佈景主題 WHERE id = '${siteInfo.佈景主題}'`)
      if (themeQuery && themeQuery.length > 0) {
        const theme = themeQuery[0]
        if (theme.配色ID) {
          const colorQuery = await sysDb?.查詢(`SELECT * FROM 配色 WHERE id = '${theme.配色ID}'`)
          return colorQuery && colorQuery.length > 0 ? new 配色(colorQuery[0]) : null
        }
      }
    }
    
    // 預設配色
    return new 配色()
  } catch (error) {
    console.error('取得配色資料失敗:', error)
    return null
  }
}

// 取得佈景主題資料
export async function getThemeData(siteInfo: any, sysDb: any) {
  if (!sysDb) return null
  
  try {
    if (siteInfo?.佈景主題) {
      const themeQuery = await sysDb?.查詢(`SELECT * FROM 佈景主題 WHERE id = '${siteInfo.佈景主題}'`)
      return themeQuery && themeQuery.length > 0 ? themeQuery[0] : null
    }
    return null
  } catch (error) {
    console.error('取得佈景主題資料失敗:', error)
    return null
  }
}

// 列出所有資料
export async function listAllData(table: string, sysDb: any) {
  if (!sysDb) return []
  
  try {
    const query = await sysDb?.查詢(`SELECT * FROM ${table}`)
    return query || []
  } catch (error) {
    console.error(`列出 ${table} 資料失敗:`, error)
    return []
  }
}
