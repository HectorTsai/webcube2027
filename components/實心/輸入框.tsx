/**
 * Example Input component using OO design
 */

import type { 基礎元件Props } from "../元件.ts";
import { 取得圓角樣式, 取得完整元件類別, 取得顏色樣式 } from "../工具.ts";

interface 輸入框Props extends 基礎元件Props {
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  value?: string;
  onInput?: (value: string) => void;
}

export default function 輸入框({
  顏色 = "主要",
  尺寸 = "中",
  圓角 = "中",
  停用 = false,
  placeholder,
  value,
  onInput,
  type = "text",
}: 輸入框Props) {
  const baseClasses = 取得完整元件類別(尺寸, "border-2");
  const colorStyle = 取得顏色樣式(顏色, true); // 使用 outline 模式
  const radiusStyle = 取得圓角樣式(圓角);

  return (
    <input
      type={type}
      class={baseClasses}
      style={`${colorStyle} ${radiusStyle}`}
      placeholder={placeholder}
      value={value}
      onInput={(e: Event) => {
        const target = e.target as HTMLInputElement;
        onInput?.(target.value);
      }}
      disabled={停用}
    />
  );
}
