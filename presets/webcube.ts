import type { Preset } from 'unocss'

// WebCube UnoCSS Preset - 建置時使用預設值
export function webcubePreset(): Preset {
  return {
    name: 'webcube-preset',
    theme: {
      colors: {
        // 使用 CSS variables，符合 daisyUI 標準
        '主色': 'var(--p)',
        '主色內容': 'var(--pc)',
        '次色': 'var(--s)',
        '次色內容': 'var(--sc)',
        '強調色': 'var(--a)',
        '強調色內容': 'var(--ac)',
        '中性色': 'var(--n)',
        '中性色內容': 'var(--nc)',
        '背景1': 'var(--b1)',
        '背景2': 'var(--b2)',
        '背景3': 'var(--b3)',
        '背景內容': 'var(--bc)',
        '資訊色': 'var(--in)',
        '資訊色內容': 'var(--inc)',
        '成功色': 'var(--su)',
        '成功色內容': 'var(--suc)',
        '警告色': 'var(--wa)',
        '警告色內容': 'var(--wac)',
        '錯誤色': 'var(--er)',
        '錯誤色內容': 'var(--erc)'
      },
      borderRadius: {
        '選擇器圓角': 'var(--radius-selector)',
        '欄位圓角': 'var(--radius-field)',
        '盒子圓角': 'var(--radius-box)'
      }
    },
    shortcuts: [
      // WebCube 元件快捷類
      {
        'webcube-卡片': 'bg-背景1 border border-背景3 rounded-lg shadow-md p-4',
        'webcube-按鈕': 'bg-主色 text-主色內容 px-4 py-2 rounded-lg hover:bg-主色 focus:ring-2 focus:ring-主色 transition-colors',
        'webcube-按鈕次': 'bg-次色 text-次色內容 px-4 py-2 rounded-lg hover:bg-次色 focus:ring-2 focus:ring-次色 transition-colors',
        'webcube-輸入框': 'bg-背景1 border border-背景3 rounded-lg px-3 py-2 text-背景內容 focus:outline-none focus:ring-2 focus:ring-主色',
        'webcube-容器': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        'webcube-標頭': 'bg-背景1 shadow-sm border-b border-背景3',
        'webcube-頁尾': 'bg-背景2 border-t border-背景3 mt-8',
        'webcube-側邊欄': 'bg-背景1 border-r border-背景3 w-64 min-h-screen',
        'webcube-主內容': 'flex-1 p-6',
        'webcube-網格': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        'webcube-彈性': 'flex flex-col md:flex-row gap-4',
        'webcube-置中': 'flex items-center justify-center',
        'webcube-兩端對齊': 'flex items-center justify-between',
        'webcube-文字': 'text-背景內容',
        'webcube-標題': 'text-2xl font-bold text-背景內容',
        'webcube-副標題': 'text-lg font-semibold text-背景內容',
        'webcube-描述': 'text-sm text-背景內容 opacity-80',
        // 圓角快捷類
        '圓角-選擇器': 'rounded-[var(--radius-selector)]',
        '圓角-欄位': 'rounded-[var(--radius-field)]',
        '圓角-盒子': 'rounded-[var(--radius-box)]',
        // 顏色快捷類 - 背景色
        '背景-主色': 'bg-主色',
        '背景-次色': 'bg-次色',
        '背景-強調色': 'bg-強調色',
        '背景-中性色': 'bg-中性色',
        '背景-1': 'bg-背景1',
        '背景-2': 'bg-背景2',
        '背景-3': 'bg-背景3',
        '背景-資訊色': 'bg-資訊色',
        '背景-成功色': 'bg-成功色',
        '背景-警告色': 'bg-警告色',
        '背景-錯誤色': 'bg-錯誤色',
        // 顏色快捷類 - 文字色
        '文字-主色': 'text-主色',
        '文字-次色': 'text-次色',
        '文字-強調色': 'text-強調色',
        '文字-中性色': 'text-中性色',
        '文字-背景內容': 'text-背景內容',
        '文字-主色內容': 'text-主色內容',
        '文字-次色內容': 'text-次色內容',
        '文字-強調色內容': 'text-強調色內容',
        '文字-中性色內容': 'text-中性色內容',
        '文字-資訊色': 'text-資訊色',
        '文字-資訊色內容': 'text-資訊色內容',
        '文字-成功色': 'text-成功色',
        '文字-成功色內容': 'text-成功色內容',
        '文字-警告色': 'text-警告色',
        '文字-警告色內容': 'text-警告色內容',
        '文字-錯誤色': 'text-錯誤色',
        '文字-錯誤色內容': 'text-錯誤色內容',
        // 顏色快捷類 - 邊框色
        '邊框-主色': 'border-主色',
        '邊框-次色': 'border-次色',
        '邊框-強調色': 'border-強調色',
        '邊框-中性色': 'border-中性色',
        '邊框-背景3': 'border-背景3',
        '邊框-資訊色': 'border-資訊色',
        '邊框-成功色': 'border-成功色',
        '邊框-警告色': 'border-警告色',
        '邊框-錯誤色': 'border-錯誤色'
      }
    ]
  }
}

// 根據 OKLCH 亮度決定文字顏色
function 決定文字顏色(oklchValue: string): string {
  const match = oklchValue.match(/^(\d+(?:\.\d+)?)%/)
  if (!match) return '0% 0 0'
  
  const lightness = parseFloat(match[1])
  return lightness > 60 ? '0% 0 0' : '100% 0 0'
}

// 從骨架模型獲取動畫設定
function 從骨架獲取動畫(骨架資料?: Record<string, unknown>): Record<string, string> {
  if (!骨架資料) {
    return {
      '下拉選單-開': 'animate__fadeIn',
      '下拉選單-關': 'animate__fadeOut',
      '抽屜-開': 'animate__fadeIn',
      '抽屜-關': 'animate__fadeOut',
      '視窗-開': 'animate__fadeIn',
      '視窗-關': 'animate__fadeOut'
    }
  }
  
  const 動畫設定 = ((骨架資料 as Record<string, unknown>).動畫 as Record<string, string>) || {}
  
  return {
    '下拉選單-開': 動畫設定['下拉選單.開'] || 'animate__fadeIn',
    '下拉選單-關': 動畫設定['下拉選單.關'] || 'animate__fadeOut',
    '抽屜-開': 動畫設定['抽屜.開'] || 'animate__fadeIn',
    '抽屜-關': 動畫設定['抽屜.關'] || 'animate__fadeOut',
    '視窗-開': 動畫設定['視窗.開'] || 'animate__fadeIn',
    '視窗-關': 動畫設定['視窗.關'] || 'animate__fadeOut'
  }
}

// 生成 CSS variables 的函數 - 運行時主題切換使用
export function 生成CSS變數(骨架資料?: Record<string, unknown>, 配色資料?: Record<string, unknown>): string {
  // 從配色和骨架模型獲取設定，或使用預設值
  const 顏色 = 配色資料 ? {
    '主色': (配色資料.主色 as string) || '59.67% 0.221 258.03',
    '主色內容': 決定文字顏色((配色資料.主色 as string) || '59.67% 0.221 258.03'),
    '次色': (配色資料.次色 as string) || '39.24% 0.128 255',
    '次色內容': 決定文字顏色((配色資料.次色 as string) || '39.24% 0.128 255'),
    '強調色': (配色資料.強調色 as string) || '77.86% 0.1489 226.0173',
    '強調色內容': 決定文字顏色((配色資料.強調色 as string) || '77.86% 0.1489 226.0173'),
    '中性色': (配色資料.中性色 as string) || '35.5192% .032071 262.988584',
    '中性色內容': 決定文字顏色((配色資料.中性色 as string) || '35.5192% .032071 262.988584'),
    '背景1': (配色資料.背景1 as string) || '100% 0 0',
    '背景1內容': 決定文字顏色((配色資料.背景1 as string) || '100% 0 0'),
    '背景2': (配色資料.背景2 as string) || '93% 0 0',
    '背景2內容': 決定文字顏色((配色資料.背景2 as string) || '93% 0 0'),
    '背景3': (配色資料.背景3 as string) || '88% 0 0',
    '背景3內容': 決定文字顏色((配色資料.背景3 as string) || '88% 0 0'),
    '背景內容': 決定文字顏色((配色資料.背景內容 as string) || '35.5192% .032071 262.988584'),
    '資訊色': (配色資料.資訊色 as string) || '71.17% 0.166 241.15',
    '資訊色內容': 決定文字顏色((配色資料.資訊色 as string) || '71.17% 0.166 241.15'),
    '成功色': (配色資料.成功色 as string) || '60.9% 0.135 161.2',
    '成功色內容': 決定文字顏色((配色資料.成功色 as string) || '60.9% 0.135 161.2'),
    '警告色': (配色資料.警告色 as string) || '73% 0.19 52',
    '警告色內容': 決定文字顏色((配色資料.警告色 as string) || '73% 0.19 52'),
    '錯誤色': (配色資料.錯誤色 as string) || '57.3% 0.234 28.28',
    '錯誤色內容': 決定文字顏色((配色資料.錯誤色 as string) || '57.3% 0.234 28.28')
  } : {
    // 預設配色
    '主色': '59.67% 0.221 258.03',
    '主色內容': '0% 0 0',
    '次色': '39.24% 0.128 255',
    '次色內容': '100% 0 0',
    '強調色': '77.86% 0.1489 226.0173',
    '強調色內容': '0% 0 0',
    '中性色': '35.5192% .032071 262.988584',
    '中性色內容': '100% 0 0',
    '背景1': '100% 0 0',
    '背景1內容': '0% 0 0',
    '背景2': '93% 0 0',
    '背景2內容': '0% 0 0',
    '背景3': '88% 0 0',
    '背景3內容': '0% 0 0',
    '背景內容': 決定文字顏色('35.5192% .032071 262.988584'),
    '資訊色': '71.17% 0.166 241.15',
    '資訊色內容': '0% 0 0',
    '成功色': '60.9% 0.135 161.2',
    '成功色內容': '100% 0 0',
    '警告色': '73% 0.19 52',
    '警告色內容': '0% 0 0',
    '錯誤色': '57.3% 0.234 28.28',
    '錯誤色內容': '100% 0 0'
  }

  const 圓角 = 骨架資料 ? {
    '選擇器': ((骨架資料 as Record<string, unknown>).圓角 as Record<string, string>)?.中 as string || '1rem',
    '欄位': ((骨架資料 as Record<string, unknown>).圓角 as Record<string, string>)?.小 as string || '0.25rem',
    '盒子': ((骨架資料 as Record<string, unknown>).圓角 as Record<string, string>)?.大 as string || '0.5rem'
  } : {
    // 預設圓角
    '選擇器': '1rem',
    '欄位': '0.25rem',
    '盒子': '0.5rem'
  }

  const 動畫 = 從骨架獲取動畫(骨架資料)
  
  return `
:root {
  /* 顏色變數 - 符合 daisyUI 標準，使用 oklch() 函數 */
  --p: oklch(${顏色['主色']});
  --pc: oklch(${顏色['主色內容']});
  --s: oklch(${顏色['次色']});
  --sc: oklch(${顏色['次色內容']});
  --a: oklch(${顏色['強調色']});
  --ac: oklch(${顏色['強調色內容']});
  --n: oklch(${顏色['中性色']});
  --nc: oklch(${顏色['中性色內容']});
  --b1: oklch(${顏色['背景1']});
  --b2: oklch(${顏色['背景2']});
  --b3: oklch(${顏色['背景3']});
  --bc: oklch(${顏色['背景內容']});
  --in: oklch(${顏色['資訊色']});
  --inc: oklch(${顏色['資訊色內容']});
  --su: oklch(${顏色['成功色']});
  --suc: oklch(${顏色['成功色內容']});
  --wa: oklch(${顏色['警告色']});
  --wac: oklch(${顏色['警告色內容']});
  --er: oklch(${顏色['錯誤色']});
  --erc: oklch(${顏色['錯誤色內容']});
  
  /* 圓角變數 - 符合 daisyUI 標準 */
  --radius-selector: ${圓角['選擇器']};
  --radius-field: ${圓角['欄位']};
  --radius-box: ${圓角['盒子']};
  
  /* 動畫變數 */
  --animation-dropdown-open: ${動畫['下拉選單-開']};
  --animation-dropdown-close: ${動畫['下拉選單-關']};
  --animation-drawer-open: ${動畫['抽屜-開']};
  --animation-drawer-close: ${動畫['抽屜-關']};
  --animation-modal-open: ${動畫['視窗-開']};
  --animation-modal-close: ${動畫['視窗-關']};
}
  `.trim()
}

export default webcubePreset
