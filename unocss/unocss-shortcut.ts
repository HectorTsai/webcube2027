// unocss-shortcut.ts (2026 方案甲全域捷徑調度中樞)
// 處理非 current 的常規原子類別，用物件選取器包裝出三態捷徑

export interface 三態ElseToken {
  activeElse: string[];
  hoverElse: string[];
  inactiveElse: string[];
}

export function getSystemShortcuts({ activeElse, hoverElse, inactiveElse }: 三態ElseToken): Record<string, any> {
  const activeStr = activeElse.join(' ') || 'border border-solid shadow-sm';
  const hoverStr = hoverElse.join(' ') || '';
  const inactiveStr = inactiveElse.join(' ') || 'bg-base-50 text-base-50-content shadow-none';

  return {
    // ⚡️ 1. c-div-active — 只在 data-active="true" 時通電
    'c-div-active': {
      '[data-active="true"]&': activeStr,
    },

    // 🔮 2. c-div-hover — 必須 active=true + hover=true + 滑鼠碰到的三重門禁
    'c-div-hover': {
      '[data-active="true"][data-hover="true"]:hover&': hoverStr,
    },

    // 🔴 3. c-div-inactive — 只在 data-active="false" 時爆發
    'c-div-inactive': {
      '[data-active="false"]&': inactiveStr,
    },

    // 🗺️ 4. cube-layout-horizontal — 水平佈局（wrapChild 子項用）
    'cube-layout-horizontal': 'flex-1 min-w-0',

    // 🌿 5. cube-zebra-item — 斑馬紋標記類（樣式在 unocss-generator.ts 的 preflights 中定義）
    'cube-zebra-item': '',

    // 🎨 6. c-divider-apply — 供電 + 預設邊框樣式套裝（分隔線等元件用）
    'c-divider-apply': 'text-current bg-current border-current border-solid border',
  };
}
