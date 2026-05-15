import { ComponentProps } from "../classes.ts";

export interface ModalProps extends ComponentProps {
  /** Alpine.js Store 中的狀態鍵名 */
  state?: string;
  /** Alpine.js Store 名稱，預設 "modals" */
  store?: string;
  /** 是否點擊背景關閉 */
  closeOnBackdrop?: boolean;
  /** 是否按 ESC 關閉 */
  closeOnEsc?: boolean;
  /** 寬度設定 */
  width?: string;
  /** 內距 */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface ModalTitleProps {
  /** 子元素 */
  children: unknown;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props */
  [key: string]: any;
}

export interface ModalFooterProps {
  /** 子元素 */
  children: unknown;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props */
  [key: string]: any;
}

export { default as default } from "./Modal.tsx";
export { default as ModalTitle } from "./ModalTitle.tsx";
export { default as ModalFooter } from "./ModalFooter.tsx";