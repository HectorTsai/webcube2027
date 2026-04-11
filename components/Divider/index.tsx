export interface DividerProps {
  /** 子元素（文字內容） */
  children?: unknown;
  /** 是否水平 */
  horizontal?: boolean;
  /** 顏色 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  /** 位置 */
  position?: "start" | "center" | "end";
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as Divider } from "./Divider.tsx";
