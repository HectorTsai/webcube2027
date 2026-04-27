import {ComponentProps} from "../classes.ts";

export interface AvatarProps extends ComponentProps {
  icon?: string;
  image?: string;
  src?: string;
  svg?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export { default as default } from "./Avatar.tsx";
