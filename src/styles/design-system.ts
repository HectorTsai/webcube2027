// 設計系統定義 - 統一的樣式管理

import { CSS_VARIABLES, getAllCSSVariables } from './css-variables.ts'
import { EMOTION_PATTERNS, getAllEmotionPatterns } from './emotion-patterns.ts'

// 設計系統版本
export const DESIGN_SYSTEM_VERSION = '1.0.0'

// 設計令牌 (Design Tokens)
export const DESIGN_TOKENS = {
  // 間距系統
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  
  // 字體系統
  typography: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  },
  
  // 圓角系統
  borderRadius: {
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.5rem',
    xl: '0.75rem',
    field: '0.375rem',
    box: '0.5rem'
  },
  
  // 陰影系統
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  }
} as const

// 容器斷點
export const CONTAINER_BREAKPOINTS = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '4xl': '2560px'
} as const

// 設計系統 API
export class DesignSystem {
  static getVersion(): string {
    return DESIGN_SYSTEM_VERSION
  }
  
  static getCSSVariables() {
    return getAllCSSVariables()
  }
  
  static getEmotionPatterns() {
    return getAllEmotionPatterns()
  }
  
  static getDesignTokens() {
    return DESIGN_TOKENS
  }
  
  static getContainerBreakpoints() {
    return CONTAINER_BREAKPOINTS
  }
  
  // AI 友好的方法
  static getAvailableStyles() {
    return {
      css_variables: this.getCSSVariables(),
      emotion_patterns: this.getEmotionPatterns(),
      design_tokens: this.getDesignTokens(),
      breakpoints: this.getContainerBreakpoints()
    }
  }
  
  // 樣式驗證
  static validateCSSVariable(variable: string): boolean {
    const allVars = Object.values(this.getCSSVariables()).flat()
    return allVars.includes(variable)
  }
  
  static validateEmotionPattern(pattern: string): boolean {
    const allPatterns = Object.values(this.getEmotionPatterns()).flat()
    return allPatterns.some(p => p.includes(pattern.split(':')[0]))
  }
}
