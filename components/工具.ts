/**
 * 元件工具函數
 */

import type { 圓角類型, 尺寸類型, 顏色類型 } from "./元件.ts";
import { 圓角類別映射, 尺寸類別映射, 顏色變數映射 } from "./元件.ts";

// 取得顏色樣式
export function 取得顏色樣式(
  顏色: 顏色類型 = "主要",
  外框: boolean = false,
): string {
  const vars = 顏色變數映射;
  const v = vars[顏色] || vars["主要"];

  if (外框) {
    return `border-color: oklch(var(${v.bg})); color: oklch(var(${v.bg}));`;
  } else {
    return `background-color: oklch(var(${v.bg})); color: oklch(var(${v.text}));`;
  }
}

// 取得尺寸類別
export function 取得尺寸類別(尺寸: 尺寸類型 = "中"): string {
  return 尺寸類別映射[尺寸] || 尺寸類別映射["中"];
}

// 取得圓角類別
export function 取得圓角類別(圓角: 圓角類型 = "中"): string {
  return 圓角類別映射[圓角] || 圓角類別映射["中"];
}

// 取得基礎元件類別
export function 取得基礎元件類別(): string {
  return "inline-flex items-center justify-center gap-2 text-sm font-medium border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
}

// 取得完整元件類別
export function 取得完整元件類別(
  尺寸: 尺寸類型 = "中",
  額外類別: string = "",
): string {
  const classes = [
    取得基礎元件類別(),
    取得尺寸類別(尺寸),
  ];

  if (額外類別) {
    classes.push(額外類別);
  }

  return classes.join(" ");
}

// 取得圓角樣式
export function 取得圓角樣式(圓角: 圓角類型 = "中"): string {
  return `border-radius: ${圓角類別映射[圓角] || 圓角類別映射["中"]};`;
}
