import {ComponentProps} from "../classes.ts";

export interface FooterProps extends ComponentProps {
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
  /** Any additional props */
  [key: string]: any;
}

export { default as default } from "./Footer.tsx";