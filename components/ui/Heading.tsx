export interface HeadingProps {
  /** Heading text content */
  text: string;
  /** Heading level (1-6) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Text size override */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  /** Font weight */
  weight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  /** Text alignment */
  align?: "left" | "center" | "right" | "justify";
}

export default function Heading({
  text,
  level = 2,
  size,
  weight = "semibold",
  align = "left",
}: HeadingProps) {
  const tagName = `h${level}`;
  
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl",
  };
  
  const weightClasses = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  };
  
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  };

  // Default size based on heading level
  const defaultSize = {
    1: "4xl",
    2: "3xl",
    3: "2xl",
    4: "xl",
    5: "lg",
    6: "md",
  }[level] as keyof typeof sizeClasses;

  const finalSize = size || defaultSize;
  const classes = `${sizeClasses[finalSize]} ${weightClasses[weight]} ${alignClasses[align]} text-gray-900`;

  return (
    <h1 class={classes}>{text}</h1>
  );
}
