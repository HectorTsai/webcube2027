import {ComponentProps} from "../classes.ts";

export interface MenuBarProps extends ComponentProps {
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | "auto";
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  sticky?: boolean;
  responsive?: boolean;
  drawerState?: string;
  [key: string]: any;
}

export interface MenuHeadProps extends ComponentProps {
  children: unknown;
}

export interface MenuFootProps extends ComponentProps {
  children: unknown;
}

export interface MenuItemProps extends ComponentProps {
  children: unknown;
  className?: string;
  [key: string]: any;
}

export { default as default } from "./MenuBar.tsx";
export { default as Head } from "./Head.tsx";
export { default as Foot } from "./Foot.tsx";
export { default as Item } from "./Item.tsx";