import {ComponentProps} from "../classes.ts";

export interface CalendarProps extends ComponentProps {
  /** 目标输入框的 ID */
  targetInputId?: string;
  /** Popup 状态名称 */
  popupState?: string;
  /** Popup Store 名称，預設 "popups" */
  popupStore?: string;
  /** 任何额外属性 */
  [key: string]: any;
}

export { default as default } from "./Calendar.tsx";
