export interface DrawerProps {
  children: unknown;
  /** Alpine.js Store 中的狀態鍵名 */
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
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" |
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "auto";
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  rounded?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  className?: string;
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
