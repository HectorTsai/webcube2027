import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function DiagonalStripesContainer({
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
  const textColor = active ? `${color}-content` : `gray-800`;

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
    `text-${textColor}`,
    "border-0",
    roundedClasses[rounded],
    shadowClasses[shadow]
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  const gradient = `repeating-linear-gradient(45deg, oklch(var(--color-${colorPrefix})/1) 0px, oklch(var(--color-${colorPrefix})/1) 10px, oklch(var(--color-${colorPrefix}-light-70)/1) 10px, oklch(var(--color-${colorPrefix}-light-70)/1) 20px)`;

  return (
    <div
      class={classes}
      style={{ width: widthStyle, height: heightStyle, backgroundImage: gradient }}
      {...restProps}
    >
      {children}
    </div>
  );
}
