import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function GradientConeContainer({
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

  const colorFrom = active ? color : `gray-300`;
  const colorTo = active ? `${color}-50` : `gray-500`;
  const textColor = active ? `${color}-content` : `gray-800`;
  const hoverColor = active ? `${color}-30` : `gray-600`;

  const widthStyle = (width === "full" || width === "auto") ? undefined : width;
  const heightStyle = (height === "full" || height === "auto") ? undefined : height;
  const widthClass = (width === "full") ? `w-${width}` : undefined;
  const heightClass = (height === "full") ? `h-${height}` : undefined;

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
    hover ? "transition-all duration-200" : undefined,
    hover ? `hover:bg-conic-[${colorFrom},${hoverColor}]` : undefined,
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={`${classes} bg-conic-[${colorFrom},${colorTo}]`} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{children}</div>;
}
