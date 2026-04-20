import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function MinimalistContainer({
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
  className,
  ...restProps}: ContainerProps) {

  const colorPrefix = active ? color : `gray-300`;
  const textColor = active ? `${color}` : `gray-800`;

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
    "bg-gray-100",
    `text-${textColor}`,
    "border border-solid border-gray-200",
    `shadow-sm shadow-${colorPrefix}`,

    roundedClasses[rounded]
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={classes} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{children}</div>;
}
