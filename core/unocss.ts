// deno-lint-ignore-file no-explicit-any
import { createGenerator } from '@unocss/core';
import { presetWind3 } from '@unocss/preset-wind3';
import { info, error } from '../utils/logger.ts';
import { 所有動畫規則, 生成完整動畫CSS } from './animate.ts';

// 自訂 preset (學習 daisyUI 設計理念)
const 自訂Preset = {
  name: 'webcube-preset',
  theme: {
    colors: {
      // UnoCSS 標準巢狀顏色定義 (使用 oklch + %alpha 支援)
      primary: {
        DEFAULT: 'oklch(var(--color-primary) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-primary-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-primary-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-primary-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-primary-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-primary-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-primary-light-90) / %alpha)',   // 90% 亮度
      },
      secondary: {
        DEFAULT: 'oklch(var(--color-secondary) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-secondary-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-secondary-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-secondary-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-secondary-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-secondary-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-secondary-light-90) / %alpha)',   // 90% 亮度
      },
      accent: {
        DEFAULT: 'oklch(var(--color-accent) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-accent-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-accent-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-accent-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-accent-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-accent-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-accent-light-90) / %alpha)',   // 90% 亮度
      },
      neutral: {
        DEFAULT: 'oklch(var(--color-neutral) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-neutral-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-neutral-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-neutral-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-neutral-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-neutral-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-neutral-light-90) / %alpha)',   // 90% 亮度
      },
      base: {
        DEFAULT: 'oklch(var(--color-base) / %alpha)',
        content: 'oklch(var(--color-base-content) / %alpha)',
        10: 'oklch(var(--color-base-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-base-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-base-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-base-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-base-light-90) / %alpha)'   // 90% 亮度
      },
      info: {
        DEFAULT: 'oklch(var(--color-info) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-info-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-info-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-info-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-info-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-info-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-info-light-90) / %alpha)',   // 90% 亮度
      },
      success: {
        DEFAULT: 'oklch(var(--color-success) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-success-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-success-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-success-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-success-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-success-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-success-light-90) / %alpha)',   // 90% 亮度
      },
      warning: {
        DEFAULT: 'oklch(var(--color-warning) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-warning-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-warning-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-warning-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-warning-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-warning-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-warning-light-90) / %alpha)',   // 90% 亮度
      },
      error: {
        DEFAULT: 'oklch(var(--color-error) / %alpha)',      // 支援透明度
        content: 'oklch(var(--color-error-content) / %alpha)', // 支援透明度
        10: 'oklch(var(--color-error-light-10) / %alpha)',   // 10% 亮度
        30: 'oklch(var(--color-error-light-30) / %alpha)',   // 30% 亮度
        50: 'oklch(var(--color-error-light-50) / %alpha)',   // 50% 亮度
        70: 'oklch(var(--color-error-light-70) / %alpha)',   // 70% 亮度
        90: 'oklch(var(--color-error-light-90) / %alpha)',   // 90% 亮度
      },
      // 基礎顏色
      white: 'oklch(var(--color-white) / %alpha)',
      black: 'oklch(var(--color-black) / %alpha)',
      transparent: 'transparent'
    },
    spacing: {
      xs: 'var(--spacing-xs)',
      sm: 'var(--spacing-sm)',
      md: 'var(--spacing-md)',
      lg: 'var(--spacing-lg)',
      xl: 'var(--spacing-xl)',
      '2xl': 'var(--spacing-2xl)'
    },
    fontSize: {
      xs: ['var(--font-size-xs)', 'var(--line-height-xs)'],
      sm: ['var(--font-size-sm)', 'var(--line-height-sm)'],
      base: ['var(--font-size-base)', 'var(--line-height-base)'],
      lg: ['var(--font-size-lg)', 'var(--line-height-lg)'],
      xl: ['var(--font-size-xl)', 'var(--line-height-xl)'],
      '2xl': ['var(--font-size-2xl)', 'var(--line-height-2xl)'],
      '3xl': ['var(--font-size-3xl)', 'var(--line-height-3xl)']
    },
    borderRadius: {
      none: '0',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      full: '9999px'
    }
  },
  rules: [
    // 修正 from-xxx/opacity，對齊新系統的 --un-gradient-stops
    [/^from-(primary|secondary|accent|info|success|warning|error)\/(\d+)$/, ([, color, opacity]) => {
      const alpha = Number(opacity) / 100;
      const colorValue = `oklch(var(--color-${color}) / ${alpha})`;
      // 新系統中，from 其實是控制 stops 的起點
      return { '--un-gradient-stops': `${colorValue}, var(--un-gradient-to, transparent)` };
    }],

    // 修正 to-xxx/opacity，對齊新系統的 --un-gradient-to
    [/^to-(primary|secondary|accent|info|success|warning|error)\/(\d+)$/, ([, color, opacity]) => {
      const alpha = Number(opacity) / 100;
      const colorValue = `oklch(var(--color-${color}) / ${alpha})`;
      return { '--un-gradient-to': colorValue };
    }],

    // 新增飽和度漸層規則 - from-chroma-{color}
    [/^from-chroma-(primary|secondary|accent|info|success|warning|error)$/, ([, color]) => {
      // 使用預先計算的飽和度變數
      return { '--un-gradient-stops': `oklch(var(--color-${color}-light) / 1), var(--un-gradient-to, transparent)` };
    }],

    // 新增飽和度漸層規則 - to-chroma-{color}
    [/^to-chroma-(primary|secondary|accent|info|success|warning|error)$/, ([, color]) => {
      // 使用正常飽和度
      return { '--un-gradient-to': `oklch(var(--color-${color}) / 1)` };
    }],

    // 處理沒有透明度的 from- 和 to-
    [/^from-(primary|secondary|accent|info|success|warning|error)$/, ([, color]) => {
      const colorValue = `oklch(var(--color-${color}) / 1)`;
      return { '--un-gradient-stops': `${colorValue}, var(--un-gradient-to, transparent)` };
    }],

    [/^to-(primary|secondary|accent|info|success|warning|error)$/, ([, color]) => {
      const colorValue = `oklch(var(--color-${color}) / 1)`;
      return { '--un-gradient-to': colorValue };
    }],

    // 強制修正 bg-gradient 結構，確保變數鏈接正確
    [/^bg-gradient-(to-[rltb])$/, ([, dir]) => {
      const directions: Record<string, string> = {
        'to-r': 'to right', 'to-l': 'to left', 'to-t': 'to top', 'to-b': 'to bottom'
      };
      return {
        '--un-gradient-shape': directions[dir],
        // 這裡不加 "in oklch"，確保最廣的相容性
        '--un-gradient': 'var(--un-gradient-shape), var(--un-gradient-stops)',
        'background-image': 'linear-gradient(var(--un-gradient))'
      };
    }, { order: 1100 }],
    // 統一使用 CSS 變數的邊框顏色 (只處理顏色，不影響寬度和樣式)
    [/^border-(primary|secondary|accent|info|success|warning|error|danger|base)$/, ([, color]) => ({
      'border-color': `oklch(var(--${color}) / <alpha>)`
    })],
    // 佈景主題相關的 utility classes
    [/^theme-(.+)$/, ([, theme]: [string, string]) => {
      return {
        '--theme': theme
      };
    }]
  ],
  shortcuts: {
    // 常用組合樣式
    'btn': 'px-4 py-2 rounded-md font-medium transition-colors duration-200',
    'icon-current': '[&>img]:filter [&>img]:brightness-0 [&>img]:invert [&>img]:transition-filter [&>img]:duration-200',
    'icon-primary': '[&>img]:filter [&>img]:brightness-0 [&>img]:invert',
    'icon-secondary': '[&>img]:filter [&>img]:brightness-0) [&>img]:hue-rotate-180 [&>img]:invert',
    'btn-primary': 'btn bg-primary text-primary-content hover:opacity-90',
    'btn-secondary': 'btn bg-secondary text-secondary-content hover:opacity-90',
    'btn-accent': 'btn bg-accent text-accent-content hover:opacity-90',
    'btn-info': 'btn bg-info text-primary-content hover:opacity-90',
    'btn-success': 'btn bg-success text-primary-content hover:opacity-90',
    'btn-warning': 'btn bg-warning text-primary-content hover:opacity-90',
    'btn-error': 'btn bg-error text-primary-content hover:opacity-90',
    'btn-danger': 'btn bg-error text-primary-content hover:opacity-90',
    // 新增按鈕風格
    'btn-outline': 'btn bg-transparent border-2 hover:bg-current hover:text-current',
    'btn-ghost': 'btn bg-transparent hover:bg-current',
    'btn-dot': 'btn bg-transparent border-2 border-dashed hover:bg-current hover:text-current',
    'btn-glow': 'btn shadow-lg hover:shadow-xl hover:scale-105 transition-transform',
    // 滾動條樣式
    'scrollbar-themed': '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-base-70 [&::-webkit-scrollbar-thumb]:rounded',
    // 新增按鈕尺寸
    'btn-xs': 'px-2 py-1 text-xs',
    'btn-sm': 'px-3 py-1.5 text-sm',
    'btn-md': 'px-4 py-2 text-base',
    'btn-lg': 'px-6 py-3 text-lg',
    'btn-xl': 'px-8 py-4 text-xl',
    'btn-2xl': 'px-10 py-5 text-2xl',
    'btn-3xl': 'px-12 py-6 text-3xl',
    'card': 'bg-base text-base-content rounded-md p-md shadow-md',
    'input': 'px-3 py-2 border border-base-70 rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
    'container': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    // 陰影類別
    'shadow-sm': 'shadow: var(--shadow-sm)',
    'shadow-md': 'shadow: var(--shadow-md)',
    'shadow-lg': 'shadow: var(--shadow-lg)',
    'shadow-none': 'shadow: var(--shadow-none)',
    // Icon 尺寸類別 - 使用 CSS variables
    'icon-xs': 'inline-block align-middle',
    'icon-sm': 'inline-block align-middle', 
    'icon-md': 'inline-block align-middle',
    'icon-lg': 'inline-block align-middle',
    'icon-xl': 'inline-block align-middle'
  }
};

// UnoCSS 生成器實例
let unoGenerator: any = null;

// 初始化 UnoCSS 生成器
export async function 初始化UnoCSS(): Promise<void> {
  try {
    unoGenerator = await createGenerator({
      presets: [
        presetWind3(), // 基礎 preset (支援 gradient 功能)
      ],
      theme: 自訂Preset.theme,
      rules: [
        // 移除舊的錯誤 gradient 規則，使用我們的自訂規則
        ...自訂Preset.rules as any,
        ...所有動畫規則 as any,
      ],
      shortcuts: 自訂Preset.shortcuts as any // 直接添加 shortcuts
    } as any);

    // await info('UnoCSS', 'UnoCSS 生成器初始化完成 (含動畫支援)');
  } catch (錯誤) {
    await error('UnoCSS', `UnoCSS 初始化失敗: ${錯誤}`);
    throw 錯誤;
  }
}

// 樣式快取
const 樣式快取 = new Map<string, string>();

// 從 HTML 內容生成 CSS (增強版)
export async function 產生樣式(html: string, 主題配色?: any, 啟用快取: boolean = true, 骨架配置?: {
  圖示尺寸?: Record<string, string>;
  圓角?: Record<string, string>;
  空間?: Record<string, string>;
  字型?: Record<string, string>;
  行高?: Record<string, string>;
  陰影?: Record<string, string>;
}): Promise<string> {
  if (!unoGenerator) {
    await 初始化UnoCSS();
  }

  try {
    // 生成快取鍵
    const 快取鍵 = 啟用快取 ? `${html.length}_${JSON.stringify(主題配色)}_${JSON.stringify(骨架配置)}` : '';
    
    // 檢查快取
    if (啟用快取 && 樣式快取.has(快取鍵)) {
      // await info('UnoCSS', '使用快取的 CSS');
      return 樣式快取.get(快取鍵)!;
    }

    // 生成基礎 CSS
    const result = await unoGenerator.generate(html, { preflights: true });
    let finalCSS = result.css;

    // 添加主題 CSS Variables
    if (主題配色) {
      const 主題CSS = 從配色生成主題CSS(主題配色, 骨架配置);
      finalCSS = `${主題CSS}\n\n${finalCSS}`;
    } else {
      // 使用預設主題
      const 預設主題CSS = 生成完整CSSVariables('light', undefined, 骨架配置);
      finalCSS = `${預設主題CSS}\n\n${finalCSS}`;
    }

    // 添加基礎樣式重置和增強
    const 基礎樣式 = `
/* Base Styles and Enhancements */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--color-base);
}

/* Icon Styles - 使用 CSS variables */
.icon {
  display: inline-block;
  vertical-align: text-bottom;
}

.icon-xs {
  width: var(--icon-xs);
  height: var(--icon-xs);
}

.icon-sm {
  width: var(--icon-sm);
  height: var(--icon-sm);
}

.icon-md {
  width: var(--icon-md);
  height: var(--icon-md);
}

.icon-lg {
  width: var(--icon-lg);
  height: var(--icon-lg);
}

.icon-xl {
  width: var(--icon-xl);
  height: var(--icon-xl);
}

/* Enhanced Button Styles */
.btn {
  cursor: pointer;
  border: none;
  outline: none;
  user-select: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Enhanced Card Styles */
.card {
  border: 1px solid var(--border-color);
  transition: box-shadow 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 6px -1px var(--shadow-color);
}

/* Enhanced Input Styles */
.input {
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  color: var(--text-primary);
  background-color: var(--color-base);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px oklch(from var(--color-primary) l c h / 0.1);
}

/* Responsive Container */
.container {
  width: 100%;
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}

@media (min-width: 1536px) {
  .container { max-width: 1536px; }
}
`;

    finalCSS = `${finalCSS}\n\n${基礎樣式}`;

    // 添加動畫 CSS
    const 動畫樣式 = 生成完整動畫CSS();
    finalCSS = `${動畫樣式}\n\n${finalCSS}`;

    // 快取結果
    if (啟用快取) {
      樣式快取.set(快取鍵, finalCSS);
      
      // 限制快取大小
      if (樣式快取.size > 100) {
        const 第一個鍵 = 樣式快取.keys().next().value;
        if (第一個鍵) {
          樣式快取.delete(第一個鍵);
        }
      }
    }

    // await info('UnoCSS', `生成 CSS 完成，共 ${finalCSS.length} 字元`);
    return finalCSS;
    
  } catch (錯誤) {
    await error('UnoCSS', `CSS 生成失敗: ${錯誤}`);
    return '/* CSS 生成失敗 */';
  }
}

// 清理樣式快取
export function 清理樣式快取(): void {
  樣式快取.clear();
  info('UnoCSS', '樣式快取已清理');
}

// 取得快取統計
export function 取得快取統計(): { 大小: number; 鍵列表: string[] } {
  return {
    大小: 樣式快取.size,
    鍵列表: Array.from(樣式快取.keys())
  };
}

// 預設主題配置
const 預設主題配置 = {
  light: {
    primary: '59.67% 0.221 258.03',        // 主色
    secondary: '39.24% 0.128 255',          // 次色
    accent: '77.86% 0.1489 226.0173',       // 強調色
    neutral: '35.5192% .032071 262.988584', // 中性色
    base: '100% 0 0',                       // 背景
    info: '71.17% 0.166 241.15',            // 資訊色
    success: '60.9% 0.135 161.2',           // 成功色
    warning: '73% 0.19 52',                 // 警告色
    error: '57.3% 0.234 28.28'              // 錯誤色
  },
  dark: {
    primary: '65% 0.25 260',
    secondary: '45% 0.15 290',
    accent: '80% 0.18 150',
    neutral: '25% 0.02 260',
    base: '15% 0.02 260',
    info: '75% 0.18 200',
    success: '65% 0.18 120',
    warning: '80% 0.18 80',
    error: '70% 0.25 25'
  }
};

// 生成完整的 CSS Variables 系統
export function 生成完整CSSVariables(主題名稱: string = 'light', 自訂配色?: Record<string, string>, 骨架配置?: {
  圖示尺寸?: Record<string, string>;
  圓角?: Record<string, string>;
  空間?: Record<string, string>;
  字型?: Record<string, string>;
  行高?: Record<string, string>;
  陰影?: Record<string, string>;
}): string {
  const 基礎主題 = 預設主題配置[主題名稱 as keyof typeof 預設主題配置] || 預設主題配置.light;
  const 最終配色 = { ...基礎主題, ...自訂配色 };
  
  // 使用骨架配置或預設值
  const 最終圖示尺寸 = 骨架配置?.圖示尺寸 || {
    'icon-xs': '1rem',
    'icon-sm': '1.25rem',
    'icon-md': '1.5rem',
    'icon-lg': '1.75rem',
    'icon-xl': '2.5rem'
  };
  
  const 最終圓角 = 骨架配置?.圓角 || {
    'radius-sm': '0.25rem',
    'radius-md': '0.5rem', 
    'radius-lg': '1rem'
  };
  
  const 最終空間 = 骨架配置?.空間 || {
    'spacing-xs': '0.5rem',
    'spacing-sm': '0.75rem',
    'spacing-md': '1rem',
    'spacing-lg': '1.5rem',
    'spacing-xl': '2rem',
    'spacing-2xl': '3rem'
  };
  
  const 最終字型 = 骨架配置?.字型 || {
    'font-size-xs': '0.75rem',
    'font-size-sm': '0.875rem',
    'font-size-base': '1rem',
    'font-size-lg': '1.125rem',
    'font-size-xl': '1.25rem',
    'font-size-2xl': '1.5rem',
    'font-size-3xl': '1.875rem'
  };
  
  const 最終行高 = 骨架配置?.行高 || {
    'line-height-xs': '1rem',
    'line-height-sm': '1.25rem',
    'line-height-base': '1.5rem',
    'line-height-lg': '1.75rem',
    'line-height-xl': '2rem'
  };
  
  const 最終陰影 = 骨架配置?.陰影 || {
    'shadow-none': '0 0 0 0 rgba(0, 0, 0, 0)',
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };
  
  const variables: string[] = [
    '/* CSS Variables for Theme System */',
    ':root {'
  ];
  
  // 添加色彩變數
  Object.entries(最終配色).forEach(([key, value]) => {
    variables.push(`  --${key}: ${value};`);
    // 為 UnoCSS 生成純數值格式的變數（不包含 oklch() 包裝）
    variables.push(`  --color-${key}: ${value};`);
    // 生成亮度變數
    if (value.includes(' ')) {
      const [l, c, h] = value.split(' ');
      variables.push(`  --${key}-l: ${l};`);
    }
    // 為 UnoCSS 生成純數值格式的 content 變數（不包含 oklch() 包裝）
    variables.push(`  --color-${key}-content: clamp(0%, calc((75% - var(--${key}-l)) * 1000), 100%) 0 0;`);
    // 生成亮度變數 - 用於漸層效果
    if (value.includes(' ')) {
      const [l, c, h] = value.split(' ');
      variables.push(`  --${key}-l: ${l};`);
      
      // 在 TypeScript 中判斷亮色系還是暗色系
      const lNum = parseFloat(l);
      const isLightColor = lNum > 50;
      
      if (isLightColor) {
        // 亮色系：變暗
        variables.push(`  --color-${key}-light-90: calc(var(--${key}-l)) ${c} ${h};`);                    // 接近原色
        variables.push(`  --color-${key}-light-70: calc(max(20%, var(--${key}-l) - 10%)) ${c} ${h};`);    // 稍暗
        variables.push(`  --color-${key}-light-50: calc(max(20%, var(--${key}-l) - 20%)) ${c} ${h};`);    // 中等暗
        variables.push(`  --color-${key}-light-30: calc(max(20%, var(--${key}-l) - 30%)) ${c} ${h};`);    // 明暗
        variables.push(`  --color-${key}-light-10: calc(max(20%, var(--${key}-l) - 40%)) ${c} ${h};`);    // 最暗
      } else {
        // 暗色系：變亮
        variables.push(`  --color-${key}-light-90: calc(var(--${key}-l)) ${c} ${h};`);                    // 接近原色
        variables.push(`  --color-${key}-light-70: calc(var(--${key}-l) + 10%) ${c} ${h};`);           // 稍亮
        variables.push(`  --color-${key}-light-50: calc(var(--${key}-l) + 20%) ${c} ${h};`);           // 中等亮
        variables.push(`  --color-${key}-light-30: calc(var(--${key}-l) + 30%) ${c} ${h};`);           // 明亮
        variables.push(`  --color-${key}-light-10: calc(min(95%, var(--${key}-l) + 40%)) ${c} ${h};`); // 最亮
      }
    }
  });
  
  // 添加圖示尺寸變數
  Object.entries(最終圖示尺寸).forEach(([key, value]) => {
    variables.push(`  --${key}: ${value};`);
  });
  
  // 添加圓角變數
  Object.entries(最終圓角).forEach(([key, value]) => {
    variables.push(`  --${key}: ${value};`);
  });
  
  // 添加空間變數
  Object.entries(最終空間).forEach(([key, value]) => {
    variables.push(`  --${key}: ${value};`);
  });
  
  // 添加字型變數
  Object.entries(最終字型).forEach(([key, value]) => {
    variables.push(`  --${key}: ${value};`);
  });
  
  // 添加行高變數
  Object.entries(最終行高).forEach(([key, value]) => {
    variables.push(`  --${key}: ${value};`);
  });
  
  // 添加陰影變數
  Object.entries(最終陰影).forEach(([key, value]) => {
    variables.push(`  --${key}: ${value};`);
  });
  
  // 添加語義化變數
  variables.push(
    '  /* Semantic Colors */',
    '  --text-primary: var(--color-base-content);',
    '  --text-secondary: oklch(from var(--color-base-content) calc(l * 0.7) c h);',
    '  --text-muted: oklch(from var(--color-base-content) calc(l * 0.5) c h);',
    '  --border-color: var(--color-base-70);',
    '  --border-hover: var(--color-base-90);',
    '  --shadow-color: oklch(from var(--color-base-content) l c h / 0.1);',
    '',
    '  /* Spacing Variables */',
    '  --spacing-xs: 0.5rem;',
    '  --spacing-sm: 0.75rem;',
    '  --spacing-md: 1rem;',
    '  --spacing-lg: 1.5rem;',
    '  --spacing-xl: 2rem;',
    '  --spacing-2xl: 3rem;',
    '',
    '  /* Font Size Variables */',
    '  --font-size-xs: 0.75rem;',
    '  --font-size-sm: 0.875rem;',
    '  --font-size-base: 1rem;',
    '  --font-size-lg: 1.125rem;',
    '  --font-size-xl: 1.25rem;',
    '  --font-size-2xl: 1.5rem;',
    '  --font-size-3xl: 1.875rem;',
    '',
    '  /* Line Height Variables */',
    '  --line-height-xs: 1rem;',
    '  --line-height-sm: 1.25rem;',
    '  --line-height-base: 1.5rem;',
    '  --line-height-lg: 1.75rem;',
    '  --line-height-xl: 1.75rem;',
    '  --line-height-2xl: 2rem;',
    '  --line-height-3xl: 2.25rem;',
    '',
    '  /* Border Radius Variables */',
    '  --radius-sm: 0.25rem;',
    '  --radius-md: 0.5rem;',
    '  --radius-lg: 1rem;',
    '',
    '  /* Shadow Variables */',
    '  --shadow-none: 0 0 0 0 rgba(0, 0, 0, 0);',
    '  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);',
    '  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
    '  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);'
  );
  
  variables.push('}');
  
  return variables.join('\n');
}

// 生成 CSS Variables 字串 (用於佈景主題) - 保持向後相容
export function 生成CSSVariables(佈景主題: any): string {
  const variables: string[] = [];
  
  if (佈景主題?.顏色) {
    Object.entries(佈景主題.顏色).forEach(([key, value]) => {
      variables.push(`--${key}: ${value}`);
    });
  }

  return variables.join('; ');
}

// 從配色模型生成主題 CSS Variables
export function 從配色生成主題CSS(配色模型: any, 骨架配置?: {
  圖示尺寸?: Record<string, string>;
  圓角?: Record<string, string>;
  空間?: Record<string, string>;
  字型?: Record<string, string>;
  行高?: Record<string, string>;
  陰影?: Record<string, string>;
}): string {
  if (!配色模型) return 生成完整CSSVariables('light', undefined, 骨架配置);
  
  const 自訂配色: Record<string, string> = {};
  
  // 從配色模型提取顏色值
  const 色彩欄位 = ['主色', '次色', '強調色', '中性色', '背景色', '背景內容', '資訊色', '成功色', '警告色', '錯誤色'];
  
  色彩欄位.forEach(欄位 => {
    if (配色模型[欄位]) {
      let cssKey = '';
      switch (欄位) {
        case '主色': cssKey = 'primary'; break;
        case '次色': cssKey = 'secondary'; break;
        case '強調色': cssKey = 'accent'; break;
        case '中性色': cssKey = 'neutral'; break;
        case '背景色': cssKey = 'base'; break; 
        case '背景內容': cssKey = 'base-content'; break;
        case '資訊色': cssKey = 'info'; break;
        case '成功色': cssKey = 'success'; break;
        case '警告色': cssKey = 'warning'; break;
        case '錯誤色': cssKey = 'error'; break;
      }
      if (cssKey) {
        自訂配色[cssKey] = 配色模型[欄位];
      }
    }
  });
  
  return 生成完整CSSVariables('light', 自訂配色, 骨架配置);
}

// 驗證 CSS class 是否安全 (防止 arbitrary values)
export function 驗證CSSClass(className: string): boolean {
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
