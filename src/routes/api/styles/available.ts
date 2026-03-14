import type { Context } from 'hono'
import { DesignSystem } from '@/styles/design-system.ts'

export default async function StylesAPI(ctx: Context) {
  try {
    // 取得所有可用樣式資源
    const styles = DesignSystem.getAvailableStyles()
    
    return ctx.json({
      成功: true,
      樣式資源: styles,
      版本: DesignSystem.getVersion(),
      說明: '從設計系統取得樣式資源'
    })

  } catch (error) {
    console.error('[API] 取得樣式資源失敗:', error)
    
    // 發生錯誤時直接傳回基本樣式資源
    return ctx.json({
      成功: true,
      樣式資源: {
        css_variables: {
          間距: ['--spacing-xs', '--spacing-sm', '--spacing-md', '--spacing-lg', '--spacing-xl'],
          字體: ['--text-xs', '--text-sm', '--text-base', '--text-lg', '--text-xl'],
          顏色: ['--p', '--s', '--a', '--b1', '--b2', '--b3']
        },
        emotion_patterns: {
          layout: ['display: flex', 'display: grid'],
          spacing: ['padding: var(--spacing-md)', 'margin: var(--spacing-md)'],
          visual: ['background-color: var(--color)', 'border-radius: var(--radius)']
        }
      },
      版本: '1.0.0',
      說明: '發生錯誤，使用基本樣式資源'
    })
  }
}
