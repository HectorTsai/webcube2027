import {ComponentProps} from "../classes.ts";

export interface DrawerProps extends ComponentProps {
  state?: string;
  /** Alpine.js Store 名稱，預設 "drawers" */
  store?: string;
  position?: "left" | "right" | "top" | "bottom";
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  /** 入場動畫 class，預設根據 position 自動選擇 slide-in-from-* */
  animateIn?: string;
  /** 退場動畫 class，預設根據 position 自動選擇 slide-out-to-* */
  animateOut?: string;
  width?: string;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  [key: string]: any;
}

export interface DrawerTitleProps {
  children: unknown;
  className?: string;
  [key: string]: any;
}

export interface DrawerFooterProps {
  children: unknown;
  className?: string;
  [key: string]: any;
}

export { default as default } from "./Drawer.tsx";
export { default as DrawerTitle } from "./DrawerTitle.tsx";
export { default as DrawerFooter } from "./DrawerFooter.tsx";