export interface ListProps {
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 子元素 */
  children: unknown;
  /** 是否有分隔線 */
  divider?: boolean;
  /** 是否緊湊 */
  compact?: boolean;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface ListRowProps {
  /** 子元素 */
  children: unknown;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface ListTitleProps {
  /** 子元素（標題文字） */
  children: unknown;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as List } from "./List.tsx";
export { default as ListRow } from "./ListRow.tsx";
export { default as ListTitle } from "./ListTitle.tsx";
