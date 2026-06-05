// unocss-theme.ts (真正同時保留 有殼 與 無殼-raw 雙軌水庫的完全體)

import 配色 from "../database/models/配色.ts";
import 骨架 from "../database/models/骨架.ts";
import 風格 from "../database/models/風格.ts";
import 裝飾 from "../database/models/裝飾.ts";

const 色彩欄位 = ['主色', '次色', '強調色', '中性色', '背景色', '資訊色', '成功色', '警告色', '錯誤色'];
const colorKeyMap: Record<string, string> = {
  '主色': 'primary', '次色': 'secondary', '強調色': 'accent',
  '中性色': 'neutral', '背景色': 'base', '資訊色': 'info',
  '成功色': 'success', '警告色': 'warning', '錯誤色': 'error'
};

export function 生成全域主題CSS(骨架模型: 骨架, 配色模型: 配色, 風格模型?: 風格, 裝飾模型?: 裝飾): string {
  const variables: string[] = [];

  色彩欄位.forEach(field => {
    const rawColor = (配色模型 as any)[field];
    if (rawColor) {
      const key = colorKeyMap[field];
      
      // 📐 剝殼機提取純物理數值
      const cleanColor = rawColor.replace(/oklch\(|\)/g, '').replace(/%/g, '').trim();
      const parts = cleanColor.split(/\s+/);
      
      let baseL = parseFloat(parts[0]) || 0.5;
      if (baseL > 1) baseL = baseL / 100;
      
      const chroma = parts[1] || "0.1";
      const hue = parts[2] || "0";
      const isLightIdiom = baseL > 0.6;

      // =========================================================================
      // 1. 基礎色（原色）雙軌保留
      // =========================================================================
      // ⚡️ 【無殼線】供 Container 局部元件動態加透明度
      variables.push(`  --color-${key}-raw: ${baseL.toFixed(4)} ${chroma} ${hue};`);
      // 📦 【有殼線】供一般常規標籤直接呼叫
      variables.push(`  --color-${key}: oklch(var(--color-${key}-raw));`);

      // =========================================================================
      // 2. 反襯色（Content）雙軌保留
      // =========================================================================
      const contentL = baseL < 0.6 ? "0.98" : "0.12";
      // ⚡️ 【無殼線】供 Container 反襯色加透明度
      variables.push(`  --color-${key}-content-raw: ${contentL} 0.01 0;`);
      // 📦 【有殼線】供一般常規標籤直接呼叫
      variables.push(`  --color-${key}-content: oklch(var(--color-${key}-content-raw));`);

      // =========================================================================
      // 3. 🚀 奇數黃金步長矩陣（90, 70, 50, 30, 10）雙軌保留
      // =========================================================================
      [90, 70, 50, 30, 10].forEach((step) => {
        const deltaL = 0.45 * ((100 - step) / 100);
        const targetL = isLightIdiom ? Math.max(0.05, baseL - deltaL) : Math.min(0.98, baseL + deltaL);
        
        const rawValueStr = `${targetL.toFixed(3)} ${chroma} ${hue}`;
        
        // 🎯 這裡！依據您的最高指示，同時保留兩種：
        // ⚡️ 【無殼線】供風格、材質、Container 現場變壓對接！
        variables.push(`  --color-${key}-${step}-raw: ${rawValueStr};`);
        
        // 📦 【有殼線】供外部原生原子類別（如 class="bg-primary-90"）直接使用
        variables.push(`  --color-${key}-${step}: oklch(var(--color-${key}-${step}-raw));`);
      });
    }
  });

  if (骨架模型 && 骨架模型.配置) {
    Object.entries(骨架模型.配置).forEach(([key, value]) => { variables.push(`  --${key}: ${value};`); });
  }

  return `:root {\n${variables.join('\n')}\n}`;
}

export function 提取UnoCSS動態Theme色彩(配色模型: 配色): Record<string, any> {
  const colorsConfig: Record<string, any> = {};

  色彩欄位.forEach(field => {
    const rawColor = (配色模型 as any)[field];
    if (rawColor) {
      const key = colorKeyMap[field];
      // 讓 UnoCSS 靜態對接全域已經包好外殼的 CSS 變數
      colorsConfig[key] = `var(--color-${key})`;
      colorsConfig[`${key}-content`] = `var(--color-${key}-content)`;
      
      // 讓 UnoCSS 也能直接識別 bg-primary-90 這種原生階梯類別
      [90, 70, 50, 30, 10].forEach(step => {
        colorsConfig[`${key}-${step}`] = `var(--color-${key}-${step})`;
      });
    }
  });

  return colorsConfig;
}