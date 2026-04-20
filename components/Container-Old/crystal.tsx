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
  className,
  ...restProps}: ContainerProps) {

  const colorPrefix = active ? color : `gray-300`;
  const textColor = active ? `${color}-content` : `gray-800`;

  const widthStyle = (width === "full" || width === "auto") ? undefined : width;
  const heightStyle = (height === "full" || height === "auto") ? undefined : height;
  const widthClass = (width === "full" || width === "auto") ? `w-${width}` : undefined;
  const heightClass = (height === "full" || height === "auto") ? `h-${height}` : undefined;

  const finalClasses = [
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
  const finalTextClasses = [
    "flex",
    directionClasses[direction],
    "z-10 w-full h-full"
  ];

  if (className) {
    //finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return (
    <div class={`${className} flex flex-col ${roundedClasses[rounded]} bg-gradient-to-t from-${colorPrefix} via-${colorPrefix}-50 to-${colorPrefix}`} style={{ width: widthStyle, height: heightStyle }} {...restProps}>
      <div class={`${classes} flex-1 bg-gradient-to-b from-white/80 via-white/10 via-50% to-transparent to-50% backdrop-${colorPrefix}-md`}>
        <div class={`${finalTextClasses.filter(Boolean).join(" ")}`}>{children}</div>
      </div>
    </div>
  );
}
