import type { Context } from 'hono'
import { 生成CSS變數 } from '../../presets/webcube.ts'
import 佈局 from '../../src/components/佈局.tsx'

/** Layout 包裝器：包裝頁面內容，提供統一佈局 */
export default function Layout(Component: () => unknown, ctx: Context) {
  // 從 middleware 取得主題資料
  const 骨架資料 = ctx.get('骨架資料')
  const 配色資料 = ctx.get('配色資料')
  
  // 生成 CSS 變數
  const cssVariables = 生成CSS變數(骨架資料, 配色資料)

  // 取得佈局風格，預設為 經典
  const 風格 = 骨架資料?.佈局 || '經典'

  return (
    <>
      {/* 注入動態 CSS 變數 */}
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      
      {/* 使用動態佈局元件 */}
      <佈局 風格={風格}>
        {Component()}
      </佈局>
    </>
  )
}
