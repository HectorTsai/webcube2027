import {ComponentProps} from "../classes.ts";
import createVariantComponent from "../index.ts";

export interface ContainerProps extends ComponentProps {
  /** 佈局方向 */
  direction?: "row" | "column";
  /** 寬度設定 (CSS 值，如 "100px", "50vw", "10rem", "full", "auto") */
  width?: string;
  /** 高度設定 (CSS 值，如 "100px", "50vh", "10rem", "full", "auto") */
  height?: string;
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
  /** 圓角 */
  rounded?: "none" | "sm" | "md" | "lg";
  /** 陰影 */
  shadow?: "none" | "sm" | "md" | "lg";
  /** 激活狀態 */
  active?: boolean;
  /** Alpine.js store 狀態名稱，用於動態控制 active 狀態 */
  activeStateName?: string;
  /** 啟用懸停效果 */
  hover?: boolean;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default createVariantComponent("Container");
