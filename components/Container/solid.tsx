import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function SolidContainer({
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
  activeStateName,
  hover = false,
  className,
  ...restProps}: ContainerProps) {

  const widthStyle = (width === "full" || width === "auto") ? undefined : width;
  const heightStyle = (height === "full" || height === "auto") ? undefined : height;
  const widthClass = (width === "full") ? `w-${width}` : undefined;
  const heightClass = (height === "full") ? `h-${height}` : undefined;

  // 如果有 activeStateName，使用 Alpine.js store 動態控制 active 狀態
  if (activeStateName) {
    const initScript = `
      if(!Alpine.store('Container')){Alpine.store('Container',{})}
      if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}
    `.replace(/\s+/g, ' ').trim();

    // 結構性類別（不含顏色）
    const baseClasses = [
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
      roundedClasses[rounded],
      hover ? "transition-all duration-200" : undefined,
      className
    ].filter(Boolean).join(" ");

    // 完整類別（結構 + 顏色）
    const activeFullClasses = `${baseClasses} bg-${color} text-${color}-content ${hover ? `hover:bg-${color}-70` : ''}`;
    const inactiveFullClasses = `${baseClasses} bg-base-70 text-base-content ${hover ? `hover:bg-base-50` : ''}`;

    return (
      <div 
        x-data
        x-init={initScript}
        x-bind:class={`$store.Container.${activeStateName} ? '${activeFullClasses}' : '${inactiveFullClasses}'`}
        style={{ width: widthStyle, height: heightStyle }}
        {...restProps}
      >
        {children}
      </div>
    );
  }

  // 沒有 activeStateName，使用原本的邏輯
  const colorPrefix = active ? color : "base-70";
  const textColor = active ? `${color}-content` : "base-content";
  const hoverColor = active ? `${color}-70` : "base-50";

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