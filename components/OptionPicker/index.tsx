import { ComponentProps, Variant, Color } from "../classes.ts";

export interface OptionItemProps {
  /** 選項值 */
  value: string;
  /** 選項內容 */
  children: any;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface OptionPickerProps extends ComponentProps {
  /** 子元件（OptionItem） */
  children?: any;
  /** 選擇模式：single=單選(Radio), multiple=多選(Checkbox) */
  mode?: 'single' | 'multiple';
  /** 選中值列表 */
  selectedValues?: string[];
  /** 變更事件回調 */
  onChange?: (values: string[]) => void;
  /** 容器變體 */
  variant?: Variant;
  /** 容器顏色 */
  color?: Color;
  /** 是否自動填滿 */
  autoFill?: boolean;
  /** 間距 */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 是否啟用 hover 效果 */
  hover?: boolean;
  /** 容器內距 */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 容器圓角 */
  rounded?: 'none' | 'sm' | 'md' | 'lg';
}

export { default as default } from "./OptionPicker.tsx";
export { default as OptionItem } from "./OptionItem.tsx";