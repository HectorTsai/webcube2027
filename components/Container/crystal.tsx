import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function CrystalContainer({
  children,
  direction = "column",
  color = "primary",
  width = "auto",
  height = "auto",
  padding = "md",
  margin = "none",
  align = "start",
  justify = "start",
  gap = "none",
  rounded = "lg",
  shadow = "none",
  active = true,
  hover = false,
  className,
  ...restProps}: ContainerProps) {

  const colorPrefix = active ? color : `base`;
  const textColor = active ? `${color}-content` : `base-content`;
  const hoverColor = active ? `hover-${color}` : `hover-base`;


  const widthStyle = (width === "full" || width === "auto") ? undefined : width;
  const heightStyle = (height === "full" || height === "auto") ? undefined : height;
  const widthClass = (width === "full" || width === "auto") ? `w-${width}` : undefined;
  const heightClass = (height === "full" || height === "auto") ? `h-${height}` : undefined;

  const finalClasses = [
    "flex",
    "box-border",
    directionClasses[direction],
    widthClass,
    heightClass,
    paddingClasses[padding],
    marginClasses[margin],
    alignClasses[align],
    justifyClasses[justify],
    gapClasses[gap],
    `text-${textColor}`,
    "border-0",
    roundedClasses[rounded],
    shadowClasses[shadow],
    `bg-crystal-${colorPrefix}`,
    hover ? `hover:bg-crystal-${hoverColor}` : undefined,
    hover ? "transition-all duration-200" : undefined,
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={classes} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{children}</div>;
}
