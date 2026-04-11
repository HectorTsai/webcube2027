export interface ButtonProps {
  /** Child elements to render inside the button */
  children: unknown;
  /** Button color theme - controls the base color used across all variants */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  /** Button variant - controls the visual style and appearance */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** Button size - controls the padding and font size */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Whether the button is disabled and cannot be clicked */
  disabled?: boolean;
  /** Button type for form submission behavior */
  type?: "button" | "submit" | "reset";
  /** Alpine.js click event handler - JavaScript expression to execute when clicked */
  onClick?: string;
  /** Additional CSS classes to apply to the button - can override or extend default styles */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export { default as default } from "./Button.tsx";
