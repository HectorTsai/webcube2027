import {ComponentProps} from "../classes.ts";

export interface CardProps extends ComponentProps {
  /** 佈局方向 */
  direction?: "row" | "column";
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
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as default } from "./Card.tsx";
