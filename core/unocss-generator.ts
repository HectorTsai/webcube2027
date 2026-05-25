// UnoCSS 統一生成器
// 根據骨架和配色動態生成 UnoCSS 配置和所有 classes
import { parseCssColor, colorToString } from '@unocss/rule-utils'
import 配色 from "../database/models/配色.ts";
import 骨架 from "../database/models/骨架.ts";
import { 快取管理器 } from './unocss-cache.ts';
import { 所有動畫規則, 生成動畫CSS } from './animate.ts';
import { createGenerator } from '@unocss/core';
import { presetWind3 } from '@unocss/preset-wind3';

export class UnoCSS生成器 {
  private 骨架: 骨架;
  private 配色: 配色;
  private unoGenerator: any = null;
  
  constructor(骨架: 骨架, 配色: 配色) {
    this.骨架 = 骨架;
    this.配色 = 配色;
  }
  
  /**
   * 從配色模型生成主題 CSS Variables
   */
  private 從配色生成主題CSS(配色模型: 配色, 骨架配置?: 骨架): string {
    const 自訂配色: Record<string, string> = {};
    
    // 從配色模型提取顏色值
    const 色彩欄位 = ['主色', '次色', '強調色', '中性色', '背景色', '資訊色', '成功色', '警告色', '錯誤色'];
    
    色彩欄位.forEach(欄位 => {
      const 顏色值 = (配色模型 as any)[欄位];
      if (顏色值) {
        let cssKey = '';
        switch (欄位) {
          case '主色': cssKey = 'primary'; break;
          case '次色': cssKey = 'secondary'; break;
          case '強調色': cssKey = 'accent'; break;
          case '中性色': cssKey = 'neutral'; break;
          case '背景色': cssKey = 'base'; break; 
          case '資訊色': cssKey = 'info'; break;
          case '成功色': cssKey = 'success'; break;
          case '警告色': cssKey = 'warning'; break;
          case '錯誤色': cssKey = 'error'; break;
        }
        if (cssKey) {
          自訂配色[cssKey] = 顏色值;
        }
      }
    });
    
    // 直接生成 CSS，使用配色和骨架的預設值
    const variables: string[] = [':root {'];
    
    // 添加顏色變數
    Object.entries(自訂配色).forEach(([key, value]) => {
      variables.push(`  --color-${key}: ${value};`);
      
      // 為基礎顏色添加對應的 content 變數
      if (['primary', 'secondary', 'accent', 'neutral', 'base', 'info', 'success', 'warning', 'error'].includes(key)) {
        // 使用 LCH 計算最佳文字顏色
        if (value.includes(' ')) {
          const [l, c, h] = value.split(' ');
          const lNum = parseFloat(l);
          
          // 根據 LCH 亮度決定文字顏色
          // 亮度 > 70% 用黑色文字，否則用白色文字
          const contentColor = lNum > 70 ? 'oklch(0% 0 0)' : 'oklch(100% 0 0)';
          variables.push(`  --color-${key}-content: ${contentColor};`);
        }
      }
      
      // 為所有顏色添加亮度變數（用於漸層）
      if (['primary', 'secondary', 'accent', 'neutral', 'base', 'info', 'success', 'warning', 'error'].includes(key)) {
        if (value.includes(' ')) {
          const [l, c, h] = value.split(' ');
          const lNum = parseFloat(l);

          const shades = [90, 70, 50, 30, 10];
          const shadeLightValues: Record<number, number> = {};

          if (lNum > 50) {
            const range = lNum - 10;
            const step = range / 4;
            shadeLightValues[90] = lNum;
            shadeLightValues[70] = Math.max(20, lNum - step);
            shadeLightValues[50] = Math.max(20, lNum - 2 * step);
            shadeLightValues[30] = Math.max(20, lNum - 3 * step);
            shadeLightValues[10] = Math.max(20, lNum - 4 * step);
          } else {
            const range = 90 - lNum;
            const step = range / 4;
            shadeLightValues[90] = lNum;
            shadeLightValues[70] = Math.min(95, lNum + step);
            shadeLightValues[50] = Math.min(95, lNum + 2 * step);
            shadeLightValues[30] = Math.min(95, lNum + 3 * step);
            shadeLightValues[10] = Math.min(95, lNum + 4 * step);
          }

          for (const shade of shades) {
            const finalL = shadeLightValues[shade];
            variables.push(`  --color-${key}-light-${shade}: ${finalL}% ${c} ${h};`);
            const contentColor = finalL > 70 ? 'oklch(0% 0 0)' : 'oklch(100% 0 0)';
            variables.push(`  --color-${key}-light-${shade}-content: ${contentColor};`);
          }
        }
      }
    });
    
    // 添加骨架配置變數
    if (骨架配置) {
      // 圓角
      if (骨架配置.圓角) {
        Object.entries(骨架配置.圓角).forEach(([key, value]) => {
          variables.push(`  --radius-${key}: ${value};`);
        });
      }
      
      // 間距
      if (骨架配置.空間) {
        Object.entries(骨架配置.空間).forEach(([key, value]) => {
          variables.push(`  --spacing-${key}: ${value};`);
        });
      }
      
      // 字體
      if (骨架配置.字型) {
        Object.entries(骨架配置.字型).forEach(([key, value]) => {
          variables.push(`  --font-size-${key}: ${value};`);
        });
      }
      
      // 行高
      if (骨架配置.行高) {
        Object.entries(骨架配置.行高).forEach(([key, value]) => {
          variables.push(`  --line-height-${key}: ${value};`);
        });
      }
      
      // 圖示尺寸
      if (骨架配置.圖示尺寸) {
        Object.entries(骨架配置.圖示尺寸).forEach(([key, value]) => {
          variables.push(`  --icon-${key}: ${value};`);
        });
      }
      
      // 陰影
      if (骨架配置.陰影) {
        Object.entries(骨架配置.陰影).forEach(([key, value]) => {
          variables.push(`  --shadow-${key}: ${value};`);
        });
      }
    }
    
    variables.push('}');
    return variables.join('\n');
  }
  
  /**
   * 初始化 UnoCSS 生成器
   */
  private async 初始化生成器(): Promise<void> {
    if (this.unoGenerator) return;
    
    this.unoGenerator = await createGenerator({
      presets: [
        presetWind3(), // Wind3 preset
      ],
      theme: this.getTheme(),
      rules: this.getRules(),
      shortcuts: this.getShortcuts()
    } as any);
  }
  
  /**
   * 從 HTML 內容生成 CSS (增強版)
   */
  async 產生樣式(html: string, 啟用快取: boolean = true): Promise<string> {
    // 初始化生成器
    await this.初始化生成器();

    try {
      // 生成快取鍵
      const 快取鍵 = 啟用快取 ? `${html.length}_${JSON.stringify(this.骨架)}_${JSON.stringify(this.配色)}` : '';
      
      // 檢查快取
      if (啟用快取 && 快取管理器.是否存在(快取鍵)) {
        return 快取管理器.取得值(快取鍵)!;
      }

      // 生成基礎 CSS
      const result = await this.unoGenerator.generate(html, { preflights: true });
      let finalCSS = result.css;

      // 添加動畫 CSS keyframes
      const 動畫CSS = 生成動畫CSS();
      finalCSS = `${動畫CSS}\n\n${finalCSS}`;

      // 添加主題 CSS Variables
      const 主題CSS = this.從配色生成主題CSS(this.配色, this.骨架);
      finalCSS = `${主題CSS}\n\n${finalCSS}`;

      // 快取結果
      if (啟用快取) {
        快取管理器.設定值(快取鍵, finalCSS);
        
        // 限制快取大小
        const 統計 = 快取管理器.取得快取統計();
        if (統計.大小 > 100) {
          const 第一個鍵 = 統計.鍵列表[0];
          快取管理器.刪除值(第一個鍵);
        }
      }

      // await info('UnoCSS', `生成 CSS 完成，共 ${finalCSS.length} 字元`);
      return finalCSS;
      
    } catch (_錯誤) {
      // await error('UnoCSS', `CSS 生成失敗: ${錯誤}`);
      return '/* CSS 生成失敗 */';
    }
  }
  
  /**
   * 生成顏色配置
   */
  private 生成顏色配置() {
    return {
      primary: {
        DEFAULT: 'oklch(var(--color-primary) / %alpha)',
        content: 'oklch(var(--color-primary-content) / %alpha)',
        10: 'oklch(var(--color-primary-light-10) / %alpha)',
        30: 'oklch(var(--color-primary-light-30) / %alpha)',
        50: 'oklch(var(--color-primary-light-50) / %alpha)',
        70: 'oklch(var(--color-primary-light-70) / %alpha)',
        90: 'oklch(var(--color-primary-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-primary-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-primary-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-primary-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-primary-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-primary-light-90-content) / %alpha)',
      },
      secondary: {
        DEFAULT: 'oklch(var(--color-secondary) / %alpha)',
        content: 'oklch(var(--color-secondary-content) / %alpha)',
        10: 'oklch(var(--color-secondary-light-10) / %alpha)',
        30: 'oklch(var(--color-secondary-light-30) / %alpha)',
        50: 'oklch(var(--color-secondary-light-50) / %alpha)',
        70: 'oklch(var(--color-secondary-light-70) / %alpha)',
        90: 'oklch(var(--color-secondary-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-secondary-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-secondary-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-secondary-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-secondary-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-secondary-light-90-content) / %alpha)',
      },
      accent: {
        DEFAULT: 'oklch(var(--color-accent) / %alpha)',
        content: 'oklch(var(--color-accent-content) / %alpha)',
        10: 'oklch(var(--color-accent-light-10) / %alpha)',
        30: 'oklch(var(--color-accent-light-30) / %alpha)',
        50: 'oklch(var(--color-accent-light-50) / %alpha)',
        70: 'oklch(var(--color-accent-light-70) / %alpha)',
        90: 'oklch(var(--color-accent-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-accent-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-accent-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-accent-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-accent-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-accent-light-90-content) / %alpha)',
      },
      neutral: {
        DEFAULT: 'oklch(var(--color-neutral) / %alpha)',
        content: 'oklch(var(--color-neutral-content) / %alpha)',
        10: 'oklch(var(--color-neutral-light-10) / %alpha)',
        30: 'oklch(var(--color-neutral-light-30) / %alpha)',
        50: 'oklch(var(--color-neutral-light-50) / %alpha)',
        70: 'oklch(var(--color-neutral-light-70) / %alpha)',
        90: 'oklch(var(--color-neutral-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-neutral-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-neutral-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-neutral-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-neutral-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-neutral-light-90-content) / %alpha)',
      },
      base: {
        DEFAULT: 'oklch(var(--color-base) / %alpha)',
        content: 'oklch(var(--color-base-content) / %alpha)',
        10: 'oklch(var(--color-base-light-10) / %alpha)',
        30: 'oklch(var(--color-base-light-30) / %alpha)',
        50: 'oklch(var(--color-base-light-50) / %alpha)',
        70: 'oklch(var(--color-base-light-70) / %alpha)',
        90: 'oklch(var(--color-base-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-base-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-base-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-base-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-base-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-base-light-90-content) / %alpha)',
      },
      info: {
        DEFAULT: 'oklch(var(--color-info) / %alpha)',
        content: 'oklch(var(--color-info-content) / %alpha)',
        10: 'oklch(var(--color-info-light-10) / %alpha)',
        30: 'oklch(var(--color-info-light-30) / %alpha)',
        50: 'oklch(var(--color-info-light-50) / %alpha)',
        70: 'oklch(var(--color-info-light-70) / %alpha)',
        90: 'oklch(var(--color-info-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-info-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-info-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-info-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-info-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-info-light-90-content) / %alpha)',
      },
      success: {
        DEFAULT: 'oklch(var(--color-success) / %alpha)',
        content: 'oklch(var(--color-success-content) / %alpha)',
        10: 'oklch(var(--color-success-light-10) / %alpha)',
        30: 'oklch(var(--color-success-light-30) / %alpha)',
        50: 'oklch(var(--color-success-light-50) / %alpha)',
        70: 'oklch(var(--color-success-light-70) / %alpha)',
        90: 'oklch(var(--color-success-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-success-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-success-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-success-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-success-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-success-light-90-content) / %alpha)',
      },
      warning: {
        DEFAULT: 'oklch(var(--color-warning) / %alpha)',
        content: 'oklch(var(--color-warning-content) / %alpha)',
        10: 'oklch(var(--color-warning-light-10) / %alpha)',
        30: 'oklch(var(--color-warning-light-30) / %alpha)',
        50: 'oklch(var(--color-warning-light-50) / %alpha)',
        70: 'oklch(var(--color-warning-light-70) / %alpha)',
        90: 'oklch(var(--color-warning-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-warning-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-warning-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-warning-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-warning-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-warning-light-90-content) / %alpha)',
      },
      error: {
        DEFAULT: 'oklch(var(--color-error) / %alpha)',
        content: 'oklch(var(--color-error-content) / %alpha)',
        10: 'oklch(var(--color-error-light-10) / %alpha)',
        30: 'oklch(var(--color-error-light-30) / %alpha)',
        50: 'oklch(var(--color-error-light-50) / %alpha)',
        70: 'oklch(var(--color-error-light-70) / %alpha)',
        90: 'oklch(var(--color-error-light-90) / %alpha)',
        '10-content': 'oklch(var(--color-error-light-10-content) / %alpha)',
        '30-content': 'oklch(var(--color-error-light-30-content) / %alpha)',
        '50-content': 'oklch(var(--color-error-light-50-content) / %alpha)',
        '70-content': 'oklch(var(--color-error-light-70-content) / %alpha)',
        '90-content': 'oklch(var(--color-error-light-90-content) / %alpha)',
      },
    };
  }
  
  /**
   * 生成 UnoCSS theme 配置
   */
  getTheme() {
    return {
      colors: this.生成顏色配置(),
      spacing: this.骨架.空間 || {},
      fontSize: this.骨架.字型 || {},
      borderRadius: this.骨架.圓角 || {},
      // 可以加入其他 theme 配置
    };
  }
  
  /**
   * 生成 UnoCSS rules 配置（包含動畫）
   */
  getRules() {
    const 基礎規則 = [
      [/^theme-(.+)$/, ([, theme]: [string, string]) => ({
        '--theme': theme
      })] as any,
      [/^bg-crystal-(.+)$/, ([, color]: [string, string]) => ({
        'background-image': `
          linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.1) 50%, transparent 50%),
          linear-gradient(to top, oklch(var(--color-${color})), oklch(var(--color-${color}-light-50)), oklch(var(--color-${color})))
        `.replace(/\s+/g, ' ').trim(),
        'backdrop-filter': 'blur(12px)',
        '-webkit-backdrop-filter': 'blur(12px)',
      })],
      [/^bg-crystal-hover-(.+)$/, ([, color]: [string, string]) => ({
        'background-image': `
          linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.1) 50%, transparent 50%),
          linear-gradient(to top, oklch(var(--color-${color})), oklch(var(--color-${color}-light-30)), oklch(var(--color-${color})))
        `.replace(/\s+/g, ' ').trim(),
        'backdrop-filter': 'blur(12px)',
        '-webkit-backdrop-filter': 'blur(12px)',
      })],
      [/^bg-conic-\[(.+)\]$/, ([, contents]: [string, string], { theme }) => {
          // 1. 處理底線轉空格，並用逗號分割
          const parts = contents.replace(/_/g, ' ').split(',')
          const resolvedParts = parts.map(part => {
            const name = part.trim()
            const baseColors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error', 'base', "neutral"]
            
            // 1. 處理帶數字的層級，例如 primary-50 -> --color-primary-light-50
            if (/^([a-z]+)-(\d+)$/.test(name)) {
              const [base] = name.split('-')
              if (baseColors.includes(base)) return `oklch(var(--color-${name.replace('-', '-light-')}) / 1)`
            }
            if (baseColors.includes(name) || name.endsWith('-content')) {
              return `oklch(var(--color-${name}) / 1)`
            }
            // 2. 使用 parseCssColor 處理 gray-300, black 等
            const colorPath = name.split('-')
            let obj = theme.colors
            for (const key of colorPath) {
              obj = obj?.[key]
              if (typeof obj === 'string') break 
            }
            if (typeof obj === 'string') return obj
            if (obj && typeof obj === 'object' && obj.DEFAULT) return obj.DEFAULT

            return name
          })

          return { 
            'background-image': `conic-gradient(${resolvedParts.join(', ')})` 
          }
      }],
      ['shadow-sm', { 'box-shadow': 'var(--shadow-sm)' }] as any,
      ['shadow-md', { 'box-shadow': 'var(--shadow-md)' }] as any,
      ['shadow-lg', { 'box-shadow': 'var(--shadow-lg)' }] as any,
      ['shadow-none', { 'box-shadow': 'var(--shadow-none)' }] as any
    ];
    
    return [...基礎規則, ...所有動畫規則 as any];
  }
  
  /**
   * 生成 UnoCSS shortcuts 配置
   */
  getShortcuts() {
    // 從骨架動態產生動畫 shortcuts
    const 動畫 = this.骨架.動畫 || {};
    
    return {
      // 按鈕
      'btn': 'px-4 py-2 rounded-sm transition-colors duration-200 no-underline',
      'btn-primary': 'btn bg-primary text-primary-content hover:bg-primary-70',
      'btn-secondary': 'btn bg-secondary text-secondary-content hover:bg-secondary-70',
      'btn-accent': 'btn bg-accent text-accent-content hover:bg-accent-70',
      'btn-info': 'btn bg-info text-primary-content hover:bg-info-70',
      'btn-success': 'btn bg-success text-primary-content hover:bg-success-70',
      'btn-warning': 'btn bg-warning text-primary-content hover:bg-warning-70',
      'btn-error': 'btn bg-error text-primary-content hover:bg-error-70',
      
      // 按鈕尺寸
      'btn-xs': 'px-2 py-1 text-xs',
      'btn-sm': 'px-3 py-1.5 text-sm',
      'btn-md': 'px-4 py-2 text-md',
      'btn-lg': 'px-6 py-3 text-lg',
      'btn-xl': 'px-8 py-4 text-xl',
      'btn-2xl': 'px-10 py-5 text-2xl',
      'btn-3xl': 'px-12 py-6 text-3xl',
      
      // 元件
      'card': 'bg-base text-base-content rounded-md p-md shadow-md',
      'input': 'px-3 py-2 border border-base-70 rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
      'container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

      // InputField 子元素
      'fieldLabel': 'px-3 py-2 text-sm shrink-0 border-r border-base-content/20',
      'fieldLabelEnd': 'px-3 py-2 text-sm shrink-0 border-l border-base-content/20',
      'fieldInput': 'flex-1 min-w-0 px-3 py-2 border-0 outline-none bg-transparent',
      'fieldButton': 'px-3 py-2 shrink-0 hover:bg-base-content/10 cursor-pointer transition-colors',
      'fieldSelect': 'flex-1 min-w-0 px-3 py-2 border-0 outline-none bg-transparent appearance-none cursor-pointer',

      // 圖示
      'icon-current': '[&>img]:filter [&>img]:brightness-0 [&>img]:invert [&>img]:transition-filter [&>img]:duration-200',
      'icon-primary': '[&>img]:filter [&>img]:brightness-0 [&>img]:invert',
      'icon-secondary': '[&>img]:filter [&>img]:brightness-0) [&>img]:hue-rotate-180 [&>img]:invert',
      
      // 滾動條
      'scrollbar-themed': '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-base-70 [&::-webkit-scrollbar-thumb]:rounded',
      
      // 圖示尺寸
      'icon-xs': 'inline-block align-middle',
      'icon-sm': 'inline-block align-middle', 
      'icon-md': 'inline-block align-middle',
      'icon-lg': 'inline-block align-middle',
      'icon-xl': 'inline-block align-middle',
      
      // 步驟組件
      'steps': 'flex list-none p-0 m-0',
      'steps:first-child .step:first-child .step-left-line': 'hidden',
      'steps:last-child .step:last-child .step-right-line': 'hidden',

      // === 動畫 shortcuts（從骨架動態產生） ===
      // Modal
      'modal-enter': 動畫?.視窗?.開 || 'animate-in fade-in zoom-in',
      'modal-leave': 動畫?.視窗?.關 || 'animate-out fade-out zoom-out',
      // Drawer
      'drawer-top-enter':    動畫?.抽屜?.['上.開'] || 'animate-in slide-in-from-top',
      'drawer-top-leave':    動畫?.抽屜?.['上.關'] || 'animate-out slide-out-to-top',
      'drawer-bottom-enter': 動畫?.抽屜?.['下.開'] || 'animate-in slide-in-from-bottom',
      'drawer-bottom-leave': 動畫?.抽屜?.['下.關'] || 'animate-out slide-out-to-bottom',
      'drawer-left-enter':   動畫?.抽屜?.['左.開'] || 'animate-in slide-in-from-left',
      'drawer-left-leave':   動畫?.抽屜?.['左.關'] || 'animate-out slide-out-to-left',
      'drawer-right-enter':  動畫?.抽屜?.['右.開'] || 'animate-in slide-in-from-right',
      'drawer-right-leave':  動畫?.抽屜?.['右.關'] || 'animate-out slide-out-to-right',
      // Dropdown
      'dropdown-enter': 動畫?.下拉選單?.開 || 'animate-in fade-in',
      'dropdown-leave': 動畫?.下拉選單?.關 || 'animate-out fade-out',
      // Popover
      'popover-enter': 動畫?.彈出?.開 || 'animate-in fade-in zoom-in',
      'popover-leave': 動畫?.彈出?.關 || 'animate-out fade-out zoom-out',
    };
  }
  
  /**
   * 生成所有可用的 classes（給 API 使用）
   */
  getAllClasses() {
    // 檢查快取
    const 快取鍵 = `classes_${JSON.stringify(this.骨架)}_${JSON.stringify(this.配色)}`;
    if (快取管理器.是否存在(快取鍵)) {
      const 快取值 = 快取管理器.取得值(快取鍵);
      if (typeof 快取值 === 'string') {
        return JSON.parse(快取值);
      }
    }
    
    const classes = {
      description: "WebCube UnoCSS 所有可用 classes - 動態生成",
      colors: this.提取顏色Classes(),
      spacing: this.提取間距Classes(),
      components: this.提取元件Classes(),
      animations: this.提取動畫Classes(),
      rules: this.提取規則Classes(),
      total: 0
    };
    
    // 計算總數
    classes.total = classes.colors.classes.length + 
                   classes.spacing.classes.length + 
                   classes.components.classes.length + 
                   classes.animations.classes.length;
    
    // 快取結果
    快取管理器.設定值(快取鍵, JSON.stringify(classes));
    
    return classes;
  }
  
  /**
   * 提取顏色相關 classes
   */
  private 提取顏色Classes() {
    const colors: string[] = [];
    const theme = this.getTheme().colors as any;
    
    for (const [colorName, colorConfig] of Object.entries(theme)) {
      if (typeof colorConfig === 'string') {
        // 基礎顏色
        colors.push(`bg-${colorName}`, `text-${colorName}`, `border-${colorName}`);
        
        // content 顏色 - 檢查 theme 中是否有對應的 content 變數
        if (theme[`${colorName}-content` as string]) {
          colors.push(`text-${colorName}-content`);
        }
        
        // 亮度變數
        for (let i = 10; i <= 90; i += 20) {
          colors.push(`bg-${colorName}-${i}`);
        }
      }
    }
    
    return {
      description: "從 UnoCSS theme 配置動態提取的顏色 classes",
      classes: [...new Set(colors)],
      total: colors.length
    };
  }
  
  /**
   * 提取間距相關 classes
   */
  private 提取間距Classes() {
    const spacing = [];
    const theme = this.getTheme();
    
    // 從 spacing 配置提取
    if (theme.spacing) {
      for (const size of Object.keys(theme.spacing)) {
        spacing.push(`p-${size}`, `px-${size}`, `py-${size}`, `pl-${size}`, `pr-${size}`);
        spacing.push(`m-${size}`, `mx-${size}`, `my-${size}`, `ml-${size}`, `mr-${size}`);
        spacing.push(`gap-${size}`);
      }
    }
    
    // 從 fontSize 配置提取
    if (theme.fontSize) {
      for (const size of Object.keys(theme.fontSize)) {
        spacing.push(`text-${size}`);
      }
    }
    
    return {
      description: "從骨架配置動態提取的間距 classes",
      classes: [...new Set(spacing)],
      total: spacing.length
    };
  }
  
  /**
   * 提取元件相關 classes
   */
  private 提取元件Classes() {
    const shortcuts = this.getShortcuts();
    const components = Object.keys(shortcuts);
    
    return {
      description: "從 shortcuts 配置提取的元件 classes",
      classes: components,
      details: shortcuts,
      total: components.length
    };
  }
  
  /**
   * 提取動畫相關 classes
   */
  private 提取動畫Classes() {
    const animations: string[] = [];
    
    // 從動畫規則提取
    (所有動畫規則 as any[]).forEach(rule => {
      if (Array.isArray(rule) && rule[0] instanceof RegExp) {
        const pattern = rule[0].toString();
        // 解析 animate-xxx 模式
        const match = pattern.match(/^\/\^animate-\(\.\+\)\?\$\/\//);
        if (match) {
          animations.push('animate-*');
        }
      }
    });
    
    return {
      description: "從動畫規則提取的動畫 classes",
      classes: animations.length > 0 ? animations : ['animate-fadeIn', 'animate-slideUp', 'animate-bounce'],
      total: animations.length
    };
  }
  
  /**
   * 提取規則相關 classes
   */
  private 提取規則Classes() {
    const rules: any[] = [];
    
    this.getRules().forEach((rule, index) => {
      if (Array.isArray(rule) && rule[0] instanceof RegExp) {
        const pattern = rule[0].toString();
        rules.push({
          index,
          pattern,
          description: `自訂規則 #${index + 1}`
        });
      }
    });
    
    return {
      description: "從 rules 配置提取的自訂規則",
      rules,
      total: rules.length
    };
  }
  
  /**
   * 驗證 CSS class 是否安全 (防止 arbitrary values)
   */
  驗證CSSClass(className: string): boolean {
    // 禁止 arbitrary values 如 text-[#ff0000]
    if (className.includes('[') && className.includes(']')) {
      return false;
    }
    
    // 禁止 javascript: 等危險內容
    if (className.includes('javascript:') || className.includes('data:')) {
      return false;
    }
    
    return true;
  }
}
