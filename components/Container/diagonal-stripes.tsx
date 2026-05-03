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
  hover = false,
  className,
  ...restProps}: ContainerProps) {

  const colorPrefix = active ? color : `base`;
  const textColor = active ? `${color}-content` : `base-content`;

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
    hover ? "transition-all duration-200" : undefined,
    hover ? `hover:shadow-md hover:shadow-${colorPrefix}/30` : undefined
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  const gradient = `repeating-linear-gradient(45deg, oklch(var(--color-${colorPrefix})/1) 0px, oklch(var(--color-${colorPrefix})/1) 10px, oklch(var(--color-${colorPrefix}-light-70)/1) 10px, oklch(var(--color-${colorPrefix}-light-70)/1) 20px)`;
  const hoverGradient = `repeating-linear-gradient(-45deg, oklch(var(--color-${colorPrefix})/1) 0px, oklch(var(--color-${colorPrefix})/1) 10px, oklch(var(--color-${colorPrefix}-light-70)/1) 10px, oklch(var(--color-${colorPrefix}-light-70)/1) 20px)`;

  return (
    <div
      {...(hover && {
        'x-data': '{ hover: false }',
        'x-on:mouseenter': 'hover = true',
        'x-on:mouseleave': 'hover = false',
        'x-bind:style': `{ backgroundImage: hover ? '${hoverGradient}' : '${gradient}' }`
      })}
      class={classes}
      style={{ 
        width: widthStyle, 
        height: heightStyle,
        ...(!hover && { backgroundImage: gradient })
      }}
      {...restProps}
    >
      {children}
    </div>
  );
}
