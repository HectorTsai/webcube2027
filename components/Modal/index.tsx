export interface ModalProps {
  /** 子元素 */
  children: unknown;
  /** Alpine.js Store 中的狀態鍵名 */
  state?: string;
  /** Alpine.js Store 名稱，預設 "modals" */
  store?: string;
  /** 是否點擊背景關閉 */
  closeOnBackdrop?: boolean;
  /** 是否按 ESC 關閉 */
  closeOnEsc?: boolean;
  /** 入場動畫 class，預設 "fade-in zoom-in" */
  animateIn?: string;
  /** 退場動畫 class，預設 "fade-out zoom-out" */
  animateOut?: string;
  /** Container 佈局變體 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" |
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 顏色主題 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  /** 寬度設定 */
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "auto";
  /** 內距 */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** 圓角 */
  rounded?: "none" | "sm" | "md" | "lg";
  /** 陰影 */
  shadow?: "none" | "sm" | "md" | "lg";
  /** 額外 CSS 類別 */
  className?: string;
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
