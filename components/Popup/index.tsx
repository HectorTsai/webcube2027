import { ComponentProps } from "../classes.ts";
export interface PopupProps extends ComponentProps {
  /** Alpine.js Store 中的狀態鍵名 */
  state?: string;
  /** Alpine.js Store 名稱，預設 "popups" */
  store?: string;
  /** 是否自動關閉 */
  autoClose?: boolean;
  /** 關閉回調函數 */
  onClose?: () => void;
  /** 定位方式 */
  position?: "absolute" | "fixed";
  /** 定位偏移 */
  offset?: { top?: string; left?: string; right?: string; bottom?: string };
  /** 入場動畫 class，預設 "fade-in zoom-in" */
  animateIn?: string;
  /** 退場動畫 class，預設 "fade-out zoom-out" */
  animateOut?: string;
  /** 任何額外屬性 */
  [key: string]: any;
}

export { default } from "./Popup.tsx";