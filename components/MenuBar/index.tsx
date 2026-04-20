import 骨架 from "../../database/models/骨架.ts";
export interface MenuBarProps {
  /** 子元素 */
  children: unknown;
  /** Logo 元素 */
  logo?: unknown;
  /** 菜单项 */
  menuItems?: unknown;
  /** 右侧 Footer 元素 */
  footer?: unknown;
  /** Container 佈局變體 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" |
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 顏色主題 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  /** 寬度設定 */
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "auto";
  /** 內距 */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** 圓角 */
  rounded?: "none" | "sm" | "md" | "lg";
  /** 陰影 */
  shadow?: "none" | "sm" | "md" | "lg";
  /** 是否固定在頂部 */
  sticky?: boolean;
  /** 是否在移動設備上使用 Drawer */
  responsive?: boolean;
  /** Drawer 的狀態鍵名 */
  drawerState?: string;
  /** Drawer 的 Store 名稱 */
  drawerStore?: string;
  /** 額外 CSS 類別 */
  className?: string;
  /** 骨架設定（自動注入） */
  skeleton?: 骨架;
  /** Any additional props */
  [key: string]: any;
}

export interface MenuItemProps {
  /** 子元素 */
  children: unknown;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props */
  [key: string]: any;
}

export { default as default } from "./MenuBar.tsx";
export { default as MenuItem } from "./MenuItem.tsx";
