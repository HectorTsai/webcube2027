import {ComponentProps} from "../classes.ts";

export interface ButtonProps extends ComponentProps {
  /** Button size - controls the padding and font size */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Whether the button is disabled and cannot be clicked */
  disabled?: boolean;
  /** Whether the button is in active state */
  active?: boolean;
  /** Button type for form submission behavior */
  type?: "button" | "submit" | "reset";
  /** Alpine.js click event handler - JavaScript expression to execute when clicked */
  onClick?: string;
  [key: string]: any;
}

export { default as default } from "./Button.tsx";
