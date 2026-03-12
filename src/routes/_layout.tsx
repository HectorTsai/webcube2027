import type { Context } from 'hono'
import { 生成CSS變數 } from '../../presets/webcube.ts'

/** Layout 包裝器：包裝頁面內容，提供統一佈局 */
export default async function Layout(Component: () => Promise<unknown>, ctx: Context) {
  // 從 middleware 取得主題資料
  const 骨架資料 = ctx.get('骨架資料')
  const 配色資料 = ctx.get('配色資料')
  
  // 生成 CSS 變數
  const cssVariables = 生成CSS變數(骨架資料, 配色資料)

  // 取得佈局風格，預設為 經典
  const 佈局類型 = 骨架資料?.佈局 || '經典'
  const 風格 = 骨架資料?.風格 || '實心'
  
  // 取得 baseURL
  const uri = ctx.get('uri') as URL
  const baseURL = uri.origin

  // 等待 Component 執行完成
  const componentResult = await Component()

  // 動態載入佈局元件
  const 佈局元件 = (await import('../../src/components/佈局.tsx')).default

  return (
    <>
      {/* 注入動態 CSS 變數 */}
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      
      {/* 使用動態佈局元件 */}
      <佈局元件 佈局={佈局類型} 風格={風格} baseURL={baseURL}>
        {componentResult}
      </佈局元件>
    </>
  )
}
