import type { Context } from 'hono'
import 配色 from '@/database/models/配色.ts'

export default async function ColorAPI(ctx: Context) {
  const { id } = ctx.req.param()
  const sysDb = ctx.get('系統資料庫') as any

  try {
    let color = null
    let source = '預設'
    
    // 從系統資料庫取得特定配色
    if (sysDb) {
      try {
        // 第一層：直接查詢指定配色
        const result = await sysDb.查詢(`SELECT * FROM 配色 WHERE id = '${id}'`)
        console.log('[API] 系統資料庫配色查詢結果:', result)
        
        if (result && result.length > 0) {
          color = new 配色(result[0])
          source = '系統資料庫'
        } else {
          // 第二層：從佈景主題查找配色
          const themeResult = await sysDb.查詢(`SELECT * FROM 佈景主題 WHERE id = '${id}'`)
          console.log('[API] 從佈景主題查找配色:', themeResult)
          
          if (themeResult && themeResult.length > 0) {
            const theme = themeResult[0]
            if (theme.配色) {
              const colorResult = await sysDb.查詢(`SELECT * FROM 配色 WHERE id = '${theme.配色}'`)
              if (colorResult && colorResult.length > 0) {
                color = new 配色(colorResult[0])
                source = '佈景主題'
              }
            }
          }
        }
      } catch (error) {
        console.log('[API] 從系統資料庫取得配色失敗:', error)
      }
    }

    // 第三層：如果都沒有找到，使用預設配色
    if (!color) {
      console.log('[API] 使用預設配色')
      color = new 配色()
      source = '預設'
    }

    // 生成 CSS Variables
    const cssVariables = {
      '--p': color.主色,
      '--pc': color.主色 + 'c',
      '--p-hover': color.主色 + '-hover',
      '--p-active': color.主色 + '-active',
      '--s': color.次色,
      '--sc': color.次色 + 'c',
      '--s-hover': color.次色 + '-hover',
      '--s-active': color.次色 + '-active',
      '--a': color.強調色,
      '--ac': color.強調色 + 'c',
      '--a-hover': color.強調色 + '-hover',
      '--a-active': color.強調色 + '-active',
      '--b1': color.背景1,
      '--b2': color.背景2,
      '--b3': color.背景3,
      '--bc': color.背景內容,
      '--success': color.成功色,
      '--warning': color.警告色,
      '--error': color.錯誤色,
      '--info': color.資訊色
    }

    const colorData = color.toJSON()
    colorData.來源 = source
    
    return ctx.json({
      成功: true,
      配色: colorData,
      CSS變數: cssVariables
    })

  } catch (error) {
    console.error('[API] 取得配色失敗:', error)
    
    // 發生錯誤時直接傳回預設配色
    const defaultColor = new 配色()
    const defaultData = defaultColor.toJSON()
    defaultData.來源 = '預設'
    
    const cssVariables = {
      '--p': defaultColor.主色,
      '--pc': defaultColor.主色 + 'c',
      '--p-hover': defaultColor.主色 + '-hover',
      '--p-active': defaultColor.主色 + '-active',
      '--s': defaultColor.次色,
      '--sc': defaultColor.次色 + 'c',
      '--s-hover': defaultColor.次色 + '-hover',
      '--s-active': defaultColor.次色 + '-active',
      '--a': defaultColor.強調色,
      '--ac': defaultColor.強調色 + 'c',
      '--a-hover': defaultColor.強調色 + '-hover',
      '--a-active': defaultColor.強調色 + '-active',
      '--b1': defaultColor.背景1,
      '--b2': defaultColor.背景2,
      '--b3': defaultColor.背景3,
      '--bc': defaultColor.背景內容,
      '--success': defaultColor.成功色,
      '--warning': defaultColor.警告色,
      '--error': defaultColor.錯誤色,
      '--info': defaultColor.資訊色
    }
    
    return ctx.json({
      成功: true,
      配色: defaultData,
      CSS變數: cssVariables,
      說明: '發生錯誤，使用預設配色'
    })
  }
}
