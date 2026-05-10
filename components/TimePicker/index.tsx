import { ComponentProps } from "../classes.ts";

export interface TimePickerProps extends ComponentProps {
  /** 表單欄位名稱 */
  name?: string;
  /** 初始時間 (HH:mm) */
  value?: string;
  /** 初始小時 */
  initialHour?: number;
  /** 初始分鐘 */
  initialMinute?: number;
  /** 是否使用 24 小時制 */
  use24Hour?: boolean;
  /** 分鐘間隔 */
  minuteInterval?: number;
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  /** 標題 */
  title?: string;
  /** 是否顯示確認按鈕 */
  showConfirm?: boolean;
  /** 確認按鈕文字 */
  confirmText?: string;
  /** 外部 input 的 ID，用於同步值。若未提供則自動生成 hidden input */
  inputId?: string;
}

export { default as default } from "./TimePicker.tsx";
