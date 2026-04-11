import createVariantComponent from "../index.ts";

export interface HoverContainerProps {
  /** 子元素 */
  children: unknown;
  /** 佈局方向 */
  direction?: "row" | "column";
  /** 佈局變體 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 顏色主題 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  /** 寬度設定 */
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "auto";
  /** 內距 */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** 外距 */
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "auto";
  /** 對齊方式 */
  align?: "start" | "center" | "end" | "stretch";
  /** 主軸對齊 */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** 間距 */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default createVariantComponent("HoverContainer", "solid");
