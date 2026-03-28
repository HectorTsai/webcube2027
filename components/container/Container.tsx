export interface ContainerProps {
  /** Child elements to render inside the container */
  children: any;
  /** Flex direction - controls layout orientation */
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  /** Cross-axis alignment - controls vertical positioning */
  align?: "start" | "center" | "end" | "stretch";
  /** Main-axis alignment - controls horizontal positioning */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** Spacing between child elements */
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** Internal spacing of the container */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  /** Container width - controls responsive behavior */
  width?: "auto" | "full" | "fit" | "screen";
  /** Additional CSS classes */
  className?: string;
}

export default function Container({
  children,
  direction = "column",
  align = "stretch",
  justify = "start",
  gap = "md",
  padding = "md",
  width = "full",
  className = "",
}: ContainerProps) {
  const baseClasses = "flex";
  
  const directionClasses = {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
  };
  
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };
  
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };
  
  const gapClasses = {
    none: "",
    xs: "gap-xs",
    sm: "gap-sm",
    md: "gap-md",
    lg: "gap-lg",
    xl: "gap-xl",
  };
  
  const paddingClasses = {
    none: "",
    xs: "p-xs",
    sm: "p-sm",
    md: "p-md",
    lg: "p-lg",
    xl: "p-xl",
  };
  
  const widthClasses = {
    auto: "w-auto",
    full: "w-full",
    fit: "w-fit",
    screen: "w-screen",
  };

  const classes = `${baseClasses} ${directionClasses[direction]} ${alignClasses[align]} ${justifyClasses[justify]} ${gapClasses[gap]} ${paddingClasses[padding]} ${widthClasses[width]} ${className}`;

  return <div class={classes}>{children}</div>;
}
