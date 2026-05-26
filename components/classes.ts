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

export function color2TextColor(color: string): string {
  const [basePart] = color.split("/");
  const parts = basePart.split("-");
  
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
    const base = parts.slice(0, -1).join("-");
    const shade = parts[parts.length - 1];
    return `text-${base}-${shade}-content`;
  }
  
  const base = parts[0];
  return `text-${base}-content`;
}

const 支援的Shade = [10, 30, 50, 70, 90];

function 四捨五入到最近(value: number, steps: number[]): number {
  let nearest = steps[0];
  let minDiff = Math.abs(value - nearest);
  for (const step of steps) {
    const diff = Math.abs(value - step);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = step;
    }
  }
  return nearest;
}

export function adjustColorLightOrOpacity(color: string, light: number, opacity: number): string {
  const clampOpacity = (v: number) => Math.min(100, Math.max(0, v));

  let base: string, currentLight: number, currentOpacity: number;

  if (color.includes("/")) {
    const [basePart, opacityPart] = color.split("/");
    base = basePart;
    currentOpacity = parseInt(opacityPart, 10);
    currentLight = 100;
  } else if (/-(\d+)$/.test(color)) {
    const match = color.match(/^([a-z]+)-(\d+)$/i);
    if (match) {
      base = match[1];
      currentLight = parseInt(match[2], 10);
      currentOpacity = 100;
    } else {
      base = color;
      currentLight = 100;
      currentOpacity = 100;
    }
  } else {
    base = color;
    currentLight = 100;
    currentOpacity = 100;
  }

  const newLight = 四捨五入到最近(currentLight - light, 支援的Shade);
  const newOpacity = clampOpacity(currentOpacity - opacity);

  if (newOpacity === 100) {
    if (newLight === 100) {
      return base;
    }
    return `${base}-${newLight}`;
  }
  if (newLight === 100) {
    return `${base}/${newOpacity}`;
  }
  return `${base}-${newLight}/${newOpacity}`;
}