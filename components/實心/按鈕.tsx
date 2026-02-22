/**
 * Example Button component for counter etc.
 */

import type { 基礎元件Props } from "../元件.ts";
import { 取得圓角樣式, 取得完整元件類別, 取得顏色樣式 } from "../工具.ts";

interface 按鈕Props extends 基礎元件Props {
  // 按鈕特有的屬性可以在這裡添加
}

export default function ({
  顏色 = "主要",
  尺寸 = "中",
  圓角 = "小",
  停用 = false,
  載入中 = false,
  onClick,
  children,
}: 按鈕Props) {
  return (
    <button
      type="button"
      class={取得完整元件類別(尺寸)}
      style={`${取得顏色樣式(顏色, false)} ${取得圓角樣式(圓角)}`}
      onClick={onClick}
      disabled={停用 || 載入中}
    >
      {載入中 && (
        <span class="inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] w-4 h-4">
        </span>
      )}
      {children}
    </button>
  );
}
