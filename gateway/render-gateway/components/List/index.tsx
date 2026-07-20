import {ComponentProps} from "../classes.ts";

export interface ListProps extends ComponentProps {
  /** 是否有分隔線 */
  divider?: boolean;
  /** 是否緊湊 */
  compact?: boolean;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface ListRowProps extends ComponentProps {
  /** 子元素 */
  children: unknown;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface ListTitleProps extends ComponentProps {
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
