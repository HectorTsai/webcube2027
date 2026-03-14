// Emotion 模式定義 - AI 可用的樣式模式

export const EMOTION_PATTERNS = {
  layout: [
    'display: flex',
    'display: grid',
    'flex-direction: row|column',
    'justify-content: start|center|end|between|around',
    'align-items: start|center|end|stretch',
    'flex-wrap: wrap|nowrap'
  ],
  sizing: [
    'width: 100%',
    'height: 100%',
    'max-width: var(--container-sm|md|lg|xl|2xl|4xl)',
    'min-height: 100vh'
  ],
  spacing: [
    'padding: var(--spacing-sm|md|lg|xl)',
    'margin: var(--spacing-sm|md|lg|xl)',
    'gap: var(--spacing-sm|md|lg|xl)'
  ],
  visual: [
    'background-color: var(--color)',
    'border: 1px solid var(--border)',
    'border-radius: var(--radius)',
    'box-shadow: var(--shadow)',
    'transition: all 0.2s ease'
  ],
  typography: [
    'font-size: var(--text-sm|md|lg|xl)',
    'font-weight: 400|500|600|700',
    'color: var(--color)',
    'text-align: left|center|right',
    'line-height: 1.6'
  ],
  animation: [
    'transition: all 0.2s ease',
    'transform: translateY(-2px)',
    'opacity: 0.8',
    'animation: fadeIn 0.3s ease'
  ]
} as const

// 取得特定類型的 Emotion 模式
export function getEmotionPatterns(類型: keyof typeof EMOTION_PATTERNS): string[] {
  return EMOTION_PATTERNS[類型]
}

// 取得所有可用的 Emotion 模式
export function getAllEmotionPatterns(): Record<string, string[]> {
  return EMOTION_PATTERNS
}

// 根據用途推薦樣式模式
export function recommendPatterns(用途: string): string[] {
  const recommendations: Record<string, string[]> = {
    '佈局': [...EMOTION_PATTERNS.layout, ...EMOTION_PATTERNS.sizing],
    '間距': EMOTION_PATTERNS.spacing,
    '視覺': EMOTION_PATTERNS.visual,
    '文字': EMOTION_PATTERNS.typography,
    '動畫': EMOTION_PATTERNS.animation,
    '容器': [...EMOTION_PATTERNS.sizing, ...EMOTION_PATTERNS.spacing]
  }
  
  return recommendations[用途] || []
}
