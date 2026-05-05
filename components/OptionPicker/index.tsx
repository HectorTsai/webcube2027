import { ComponentProps, Variant, Color } from "../classes.ts";

export interface OptionItemProps {
  /** 選項值 */
  value: string;
  /** 選項內容 */
  children: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** 容器變體 */
  variant?: Variant;
  /** 容器顏色 */
  color?: Color;
  /** 是否啟用 hover 效果 */
  hover?: boolean;
  /** 容器內距 */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 容器圓角 */
  rounded?: 'none' | 'sm' | 'md' | 'lg';
  /** 是否自動填滿 */
  autoFill?: boolean;
  /** 表單名稱 */
  name?: string;
  /** 選擇模式 */
  mode?: 'single' | 'multiple';
  /** 是否預設選中 */
  checked?: boolean;
}

export interface OptionPickerProps extends ComponentProps {
  /** 子元件（OptionItem） */
  children?: any;
  /** 選擇模式：single=單選(Radio), multiple=多選(Checkbox) */
  mode?: 'single' | 'multiple';
  /** 表單名稱 */
  name?: string;
  /** 容器變體（會傳給所有 OptionItem） */
  variant?: Variant;
  /** 容器顏色（會傳給所有 OptionItem） */
  color?: Color;
  /** 是否自動填滿（會傳給所有 OptionItem） */
  autoFill?: boolean;
  /** 間距 */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 容器內距（會傳給所有 OptionItem） */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 容器圓角（會傳給所有 OptionItem） */
  rounded?: 'none' | 'sm' | 'md' | 'lg';
}

export { default as default } from "./OptionPicker.tsx";
export { default as OptionItem } from "./OptionItem.tsx";