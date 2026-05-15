export type Color = "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger" | "base" | "neutral";

export type Variant = "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";

export interface ComponentProps {
  children?: unknown;
  color?: Color;
  variant?: Variant;
  className?: string;
  context?: any;
} 

export const textClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "9xl": "text-9xl",
};

export const paddingClasses = {
  none: "p-0",
  xs: "p-xs",
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
  xl: "p-xl",
  "2xl": "p-2xl",
  "3xl": "p-3xl",
};

export const marginClasses = {
  none: "m-0",
  xs: "m-xs",
  sm: "m-sm",
  md: "m-md",
  lg: "m-lg",
  xl: "m-xl",
  auto: "mx-auto",
};