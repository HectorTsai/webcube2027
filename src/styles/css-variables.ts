// CSS Variables 定義 - AI 可用的樣式資源

export const CSS_VARIABLES = {
  顏色: {
    primary: ['--p', '--pc', '--p-hover', '--p-active'],
    secondary: ['--s', '--sc', '--s-hover', '--s-active'],
    accent: ['--a', '--ac', '--a-hover', '--a-active'],
    surface: ['--b1', '--b2', '--b3', '--bc', '--bc-muted'],
    semantic: ['--success', '--warning', '--error', '--info']
  },
  間距: ['--spacing-xs', '--spacing-sm', '--spacing-md', '--spacing-lg', '--spacing-xl'],
  字體: ['--text-xs', '--text-sm', '--text-base', '--text-lg', '--text-xl', '--text-2xl', '--text-3xl'],
  圓角: ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-field', '--radius-box'],
  陰影: ['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl'],
  容器: ['--container-sm', '--container-md', '--container-lg', '--container-xl', '--container-2xl', '--container-4xl']
} as const

// 取得特定類型的 CSS Variables
export function getCSSVariables(類型: keyof typeof CSS_VARIABLES): string[] {
  return CSS_VARIABLES[類型]
}

// 取得所有可用的 CSS Variables
export function getAllCSSVariables(): Record<string, string[]> {
  return CSS_VARIABLES
}
