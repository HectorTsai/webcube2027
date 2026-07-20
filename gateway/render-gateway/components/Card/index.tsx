import {ComponentProps} from "../classes.ts";

export interface CardProps extends ComponentProps {
  /** 圖像資料庫ID */
  image?: string;
  /** 圖像URL */
  src?: string;
  /** 佈局方向 */
  direction?: "row" | "column";
  /** 對齊方式 */
  align?: "start" | "center" | "end" | "stretch";
  /** 主軸對齊 */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** 間距 */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface CardTitleProps extends ComponentProps {
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface CardBodyProps extends ComponentProps {
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface CardFootProps extends ComponentProps {
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as default } from "./Card.tsx";
export { default as CardTitle } from "./Title.tsx";
export { default as CardBody } from "./Body.tsx";
export { default as CardFoot } from "./Foot.tsx";
