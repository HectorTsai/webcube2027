export interface CalendarProps {
  /** 子元素 */
  children?: unknown;
  /** 自定义类名 */
  className?: string;
  /** 变体 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 颜色 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  /** 任何额外属性 */
  [key: string]: any;
}

export { default as default } from "./Calendar.tsx";
