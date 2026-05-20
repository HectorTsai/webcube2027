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
  md: "text-md",
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

export const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export const gapClasses = {
  none: "gap-0",
  xs: "gap-xs",
  sm: "gap-sm",
  md: "gap-md",
  lg: "gap-lg",
  xl: "gap-xl",
};

export const roundedClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export const shadowClasses = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export const directionClasses = {
  row: "flex-row",
  column: "flex-col",
};

export const sizeMap = {
  xs: "1.5rem",
  sm: "2rem",
  md: "2.5rem",
  lg: "3rem",
  xl: "4rem",
  "2xl": "6rem",
  "3xl": "8rem",
  full: "100%",
  auto: "auto",
};