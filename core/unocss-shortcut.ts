// unocss-shortcut.ts (2026 方案甲全域捷徑調度中樞 - 物件選取器完全體)
import 風格 from "../database/models/風格.ts";

export function getSystemShortcuts(風格模型?: 風格): Record<string, any> {
  const jsonActive = (風格模型 as any)?.配置?.active || "bg-primary text-primary-content";     
  const jsonInactive = (風格模型 as any)?.配置?.inactive || "bg-base-50 text-base-50-content"; 
  const jsonHover = (風格模型 as any)?.配置?.hover || "hover:bg-primary-70";

  // 📐 清理掉 hover: 這種前綴字眼，因為我們等等要自己手動包裝高精準度的原生 :hover
  const cleanHover = jsonHover.replace('hover:', '');

  return {
    // ⚡️ 1. 常態激活捷徑
    // 當網頁出現 .container 時，UnoCSS 吐出的 CSS 只會在 data-active="true" 時通電！
    'container': {
      // 物件 Key 寫死屬性選取器，UnoCSS 會直接將內部的風格字串編譯展開成實體屬性！
      '[data-active="true"]&': jsonActive
    },

    // 🔮 2. 懸停變壓捷徑
    // 只有在 active=true 且 hover=true 且滑鼠碰到的時候才通電
    'container-hover': {
      '[data-active="true"][data-hover="true"]:hover&': cleanHover
    },

    // 🔴 3. 失活冷卻捷徑
    // 只有在 data-active="false" 時，爆發最高權重，直接層疊覆蓋
    'container-inactive': {
      '[data-active="false"]&': jsonInactive
    }
  };
}