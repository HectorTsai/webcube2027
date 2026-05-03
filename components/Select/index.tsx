import {ComponentProps} from "../classes.ts";

export interface SelectProps extends ComponentProps {
  /** 當前選擇的值 */
  value?: string;
  /** 預設值 */
  defaultValue?: string;
  /** Alpine.js Store 中的狀態鍵名 */
  state?: string;
  /** Alpine.js Store 名稱，預設 "selects" */
  store?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 佔位符文字 */
  placeholder?: string;
  /** 是否顯示下拉箭頭 */
  showArrow?: boolean;
  /** 下拉選單位置 */
  placement?: "top" | "bottom";
  /** 下拉選單最大高度 */
  maxHeight?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface OptionProps extends ComponentProps {
  /** 選項的值 */
  value: string;
  /** 是否禁用此選項 */
  disabled?: boolean;
  /** 是否為分隔線 */
  divider?: boolean;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as default } from "./Select.tsx";
export { default as Option } from "./Option.tsx";