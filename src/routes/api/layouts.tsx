import type { Context } from 'hono'
import { join } from 'node:path'
import { basename } from 'node:path'

export default async function LayoutsAPI(ctx: Context) {
  try {
    // 掃描 components/佈局 目錄下的所有 .tsx 檔案
    const layoutsDir = join(Deno.cwd(), 'src/components/佈局')
    
    const layouts: string[] = []
    
    try {
      // 讀取目錄內容
      for await (const entry of Deno.readDir(layoutsDir)) {
        if (entry.isFile && entry.name.endsWith('.tsx')) {
          // 取得不包含副檔名的檔名
          const layoutName = basename(entry.name, '.tsx')
          layouts.push(layoutName)
        }
      }
    } catch (error) {
      console.error('[API] 掃描佈局目錄失敗:', error)
    }
    
    // 排序佈局名稱
    layouts.sort()
    
    return ctx.json({
      成功: true,
      佈局: layouts,
      數量: layouts.length,
      說明: '可用的佈局風格'
    })
    
  } catch (error) {
    console.error('[API] 取得佈局清單失敗:', error)
    
    return ctx.json({
      成功: false,
      佈局: ['經典'], // 預設至少有經典佈局
      數量: 1,
      說明: '取得佈局清單失敗，回傳預設佈局'
    })
  }
}
