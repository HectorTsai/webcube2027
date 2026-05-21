import {ComponentProps} from "../classes.ts";
import 骨架 from "../../database/models/骨架.ts";

export interface MenuBarProps extends ComponentProps {
  /** Logo 元素 */
  logo?: unknown;
  /** 菜单项 */
  menuItems?: unknown;
  /** 右侧 Footer 元素 */
  footer?: unknown;
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "auto";
  /** 內距 */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** 是否固定在頂部 */
  sticky?: boolean;
  /** 是否在移動設備上使用 Drawer */
  responsive?: boolean;
  /** Drawer 的狀態鍵名 */
  drawerState?: string;
  /** Any additional props */
  [key: string]: any;
}

export interface MenuItemProps extends ComponentProps {
  /** 子元素 */
  children: unknown;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props */
  [key: string]: any;
}

export { default as default } from "./MenuBar.tsx";
export { default as MenuItem } from "./MenuItem.tsx";
