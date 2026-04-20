import type { HoverContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function SolidHoverContainer({
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
  ...restProps}: HoverContainerProps) {

  const colorPrefix = active ? color : `gray-300`;
  const textColor = active ? `${color}-content` : `gray-800`;
  const hoverColor = active ? `${color}-70` : `gray-400`;

  const widthStyle = (width === "full" || width === "auto") ? undefined : width;
  const heightStyle = (height === "full" || height === "auto") ? undefined : height;
  const widthClass = (width === "full" || width === "auto") ? `w-${width}` : undefined;
  const heightClass = (height === "full" || height === "auto") ? `h-${height}` : undefined;

  const finalClasses = [
    "flex",
    directionClasses[direction],
    widthClass,
    heightClass,
    paddingClasses[padding],
    marginClasses[margin],
    alignClasses[align],
    justifyClasses[justify],
    gapClasses[gap],
    `bg-${colorPrefix}`,
    `text-${textColor}`,
    roundedClasses[rounded],
    hover ? `hover:bg-${hoverColor}` : undefined,
    hover ? "transition-all duration-200" : undefined
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={classes} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{children}</div>;
}
