import { ComponentProps } from "../classes.ts";

export interface DatePickerProps extends ComponentProps {
  /** 表單欄位名稱 */
  name?: string;
  /** 初始日期值 (YYYY-MM-DD) */
  value?: string;
  /** 最小年份 */
  minYear?: number;
  /** 最大年份 */
  maxYear?: number;
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  /** 標題 */
  title?: string;
  /** 外部 input 的 ID，用於同步值。若未提供則自動生成 hidden input */
  inputId?: string;
}

export { default as default } from "./DatePicker.tsx";
