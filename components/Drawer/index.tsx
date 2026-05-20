import {ComponentProps} from "../classes.ts";

export interface DrawerProps extends ComponentProps {
  state?: string;
  position?: "left" | "right" | "top" | "bottom";
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
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