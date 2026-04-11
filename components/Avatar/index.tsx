import type { ContainerProps } from "../Container/index.tsx";

export interface AvatarProps extends Omit<ContainerProps, "children" | "direction" | "width" | "padding" | "margin" | "align" | "justify" | "gap"> {
  icon?: string;
  image?: string;
  src?: string;
  svg?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  context?: any;
}

export { default as default } from "./Avatar.tsx";
