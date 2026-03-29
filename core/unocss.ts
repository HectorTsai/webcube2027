// deno-lint-ignore-file no-explicit-any
import { createGenerator } from '@unocss/core';
import { presetWind } from '@unocss/preset-wind';
import { info, error } from '../utils/logger.ts';
import { 所有動畫規則, 生成完整動畫CSS } from './animate.ts';

// 自訂 preset (學習 daisyUI 設計理念)
const 自訂Preset = {
  name: 'webcube-preset',
  theme: {
    colors: {
      // 使用 oklch 格式的顏色系統
      primary: 'oklch(0.7 0.15 260)',
      secondary: 'oklch(0.6 0.12 290)',
      accent: 'oklch(0.65 0.2 150)',
      neutral: 'oklch(0.4 0.02 260)',
      base: {
        100: 'oklch(0.95 0.01 260)',
        200: 'oklch(0.9 0.02 260)',
        300: 'oklch(0.8 0.03 260)',
        content: 'oklch(0.2 0.02 260)'
      },
      info: 'oklch(0.7 0.15 200)',
      success: 'oklch(0.7 0.15 120)',
      warning: 'oklch(0.8 0.15 80)',
      error: 'oklch(0.7 0.2 25)'
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
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      full: '9999px'
    }
  },
  rules: [
    // DaisyUI 風格的文字顏色 (使用預定義的 content 變數)
    [/^text-(.+)-content$/, ([, color]: [string, string]) => {
      return {
        color: `var(--color-${color}-content)`
      };
    }],
    // 主題背景色
    [/^bg-(.+)$/, ([, color]) => ({
      'background-color': `var(--color-${color})`
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
    'btn-primary': 'btn bg-primary text-primary-content hover:opacity-90',
    'btn-secondary': 'btn bg-secondary text-secondary-content hover:opacity-90',
    'btn-accent': 'btn bg-accent text-accent-content hover:opacity-90',
    'card': 'bg-base-100 text-base-content rounded-md p-md shadow-md',
    'input': 'px-3 py-2 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary',
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
    unoGenerator = createGenerator({
      presets: [
        presetWind(), // Tailwind 相容 preset
      ],
      theme: 自訂Preset.theme,
      rules: [
        ...自訂Preset.rules as any,
        ...所有動畫規則 as any,
      ],
      shortcuts: 自訂Preset.shortcuts as any // 直接添加 shortcuts
    } as any);

    await info('UnoCSS', 'UnoCSS 生成器初始化完成 (含動畫支援)');
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
      await info('UnoCSS', '使用快取的 CSS');
      return 樣式快取.get(快取鍵)!;
    }

    // 生成基礎 CSS
    const result = await unoGenerator.generate(html);
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
  background-color: var(--color-base-100);
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
  background-color: var(--color-base-100);
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

    await info('UnoCSS', `生成 CSS 完成，共 ${finalCSS.length} 字元`);
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

// 取得可用的 class 列表 (供 AI 生成用)
export function 取得可用Classes(): string[] {
  const tailwindClasses = [
    // 佈局
    'container', 'flex', 'grid', 'block', 'inline', 'hidden',
    // 間距
    'p-4', 'px-4', 'py-2', 'm-4', 'mx-auto', 'my-4',
    // 顏色 (使用自訂顏色系統)
    'bg-primary', 'bg-secondary', 'bg-accent', 'bg-base-100',
    'text-primary-content', 'text-secondary-content', 'text-accent-content', 'text-base-content',
    // 文字
    'text-sm', 'text-base', 'text-lg', 'text-xl', 'font-bold', 'font-medium',
    // 邊框與圓角
    'border', 'border-2', 'rounded', 'rounded-lg', 'rounded-full',
    // 陰影
    'shadow', 'shadow-md', 'shadow-lg',
    // 響應式
    'sm:text-lg', 'md:flex', 'lg:grid-cols-3'
  ];

  const 自訂Classes = [
    // 按鈕
    'btn', 'btn-primary', 'btn-secondary', 'btn-accent',
    // 卡片
    'card',
    // 輸入框
    'input',
    // DaisyUI 風格的文字顏色
    'text-primary-content', 'text-secondary-content', 'text-accent-content'
  ];

  return [...tailwindClasses, ...自訂Classes];
}

// 預設主題配置
const 預設主題配置 = {
  light: {
    primary: '59.67% 0.221 258.03',        // 主色
    secondary: '39.24% 0.128 255',          // 次色
    accent: '77.86% 0.1489 226.0173',       // 強調色
    neutral: '35.5192% .032071 262.988584', // 中性色
    'base-100': '100% 0 0',                 // 背景1
    'base-200': '93% 0 0',                  // 背景2
    'base-300': '88% 0 0',                  // 背景3
    'base-content': '35.5192% .032071 262.988584', // 背景內容
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
    'base-100': '15% 0.02 260',
    'base-200': '20% 0.02 260',
    'base-300': '25% 0.02 260',
    'base-content': '85% 0.02 260',
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
    // 同時生成 oklch 格式的變數
    variables.push(`  --color-${key}: oklch(${value});`);
    // 生成亮度變數
    if (value.includes(' ')) {
      const [l, c, h] = value.split(' ');
      variables.push(`  --${key}-l: ${l};`);
    }
    // 使用你說的公式，用亮度變數計算 content 顏色
    variables.push(`  --color-${key}-content: oklch(clamp(0%, calc((75% - var(--${key}-l)) * 1000), 100%) 0 0);`);
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
    '  --border-color: var(--color-base-300);',
    '  --border-hover: var(--color-base-200);',
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
  const 色彩欄位 = ['主色', '次色', '強調色', '中性色', '背景1', '背景2', '背景3', '背景內容', '資訊色', '成功色', '警告色', '錯誤色'];
  
  色彩欄位.forEach(欄位 => {
    if (配色模型[欄位]) {
      let cssKey = '';
      switch (欄位) {
        case '主色': cssKey = 'primary'; break;
        case '次色': cssKey = 'secondary'; break;
        case '強調色': cssKey = 'accent'; break;
        case '中性色': cssKey = 'neutral'; break;
        case '背景1': cssKey = 'base-100'; break;
        case '背景2': cssKey = 'base-200'; break;
        case '背景3': cssKey = 'base-300'; break;
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
