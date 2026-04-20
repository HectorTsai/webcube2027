export interface FooterProps {
  /** 子元素 */
  children: unknown;
  /** Container 佈局變體 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" |
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 顏色主題 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  /** 寬度設定 */
  width?: string;
  /** 內距 */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** 圓角 */
  rounded?: "none" | "sm" | "md" | "lg";
  /** 陰影 */
  shadow?: "none" | "sm" | "md" | "lg";
  /** 是否固定在底部 */
  sticky?: boolean;
  /** 額外 CSS 類別 */
  className?: string;
  /** 骨架設定（自動注入） */
  skeleton?: {
    動畫?: Record<string, string>;
  };
  /** Any additional props */
  [key: string]: any;
}

export { default as default } from "./Footer.tsx";