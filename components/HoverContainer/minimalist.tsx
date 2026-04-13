import type { HoverContainerProps } from "./index.tsx";

export default function MinimalistHoverContainer({
  children,
  direction = "column",
  color = "primary",
  width = "full",
  padding = "md",
  margin = "none",
  align = "start",
  justify = "start",
  gap = "none",
  rounded = "sm",
  shadow = "none",
  className,
  ...restProps}: HoverContainerProps) {
  const widthClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
    auto: "w-auto",
  };

  const paddingClasses = {
    none: "p-0",
    xs: "p-xs",
    sm: "p-sm",
    md: "p-md",
    lg: "p-lg",
    xl: "p-xl",
    "2xl": "p-2xl",
  };

  const marginClasses = {
    none: "m-0",
    xs: "m-xs",
    sm: "m-sm",
    md: "m-md",
    lg: "m-lg",
    xl: "m-xl",
    auto: "mx-auto",
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
    none: "gap-0",
    xs: "gap-xs",
    sm: "gap-sm",
    md: "gap-md",
    lg: "gap-lg",
    xl: "gap-xl",
  };

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
  };

  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const directionClasses = {
    row: "flex-row",
    column: "flex-col",
  };

  const finalClasses = [
    "flex",
    directionClasses[direction],
    widthClasses[width],
    paddingClasses[padding],
    marginClasses[margin],
    alignClasses[align],
    justifyClasses[justify],
    gapClasses[gap],
    "bg-gray-100",
    `text-${color}`,
    "border border-solid border-gray-200",
    `shadow-sm shadow-${color}`,
    roundedClasses[rounded],
    "transition-all duration-200",
    "hover:bg-gray-200"
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={classes} {...restProps}>{children}</div>;
}
