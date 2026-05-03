import {ComponentProps} from "../classes.ts";

export interface HeroProps extends ComponentProps {
  /** 背景圖像資料庫ID */
  backgroundImage?: string;
  /** 背景圖像URL */
  backgroundSrc?: string;
  /** 背景圖像SVG */
  backgroundSvg?: string;
  /** 佈局方向 */
  direction?: "row" | "column";
  /** 對齊方式 */
  align?: "start" | "center" | "end" | "stretch";
  /** 主軸對齊 */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** 間距 */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** 是否全螢幕 */
  fullScreen?: boolean;
  /** 最小高度 */
  minHeight?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface HeroTitleProps extends ComponentProps {
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface HeroSubtitleProps extends ComponentProps {
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface HeroContentProps extends ComponentProps {
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export interface HeroActionsProps extends ComponentProps {
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as default } from "./Hero.tsx";
export { default as HeroTitle } from "./Title.tsx";
export { default as HeroSubtitle } from "./Subtitle.tsx";
export { default as HeroContent } from "./Content.tsx";
export { default as HeroActions } from "./Actions.tsx";