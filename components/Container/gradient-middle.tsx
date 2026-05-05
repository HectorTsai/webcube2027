import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function GradientMiddleContainer({
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
    "border-0",
    roundedClasses[rounded],
    shadowClasses[shadow],
    hover ? "transition-all duration-200" : undefined,
    className
  ].filter(Boolean).join(" ");

  // 完整類別（結構 + 顏色）
  const activeFullClasses = `${baseClasses} bg-gradient-to-t from-${color} via-${color}-50 to-${color} text-${color}-content ${hover ? `hover:via-${color}-30` : ''}`;
  const inactiveFullClasses = `${baseClasses} bg-gradient-to-t from-gray-300 via-gray-400 to-gray-300 text-gray-800 ${hover ? `hover:via-gray-500` : ''}`;

  // 如果有 activeStateName，使用 Alpine.js store 動態控制 active 狀態
  if (activeStateName) {
    const initScript = `
      if(!Alpine.store('Container')){Alpine.store('Container',{})}
      if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}
    `.replace(/\s+/g, ' ').trim();

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
  const colorFrom = active ? color : `gray-300`;
  const colorVia = active ? `${color}-50` : `gray-400`;
  const colorTo = active ? color : `gray-300`;
  const textColor = active ? `${color}-content` : `gray-800`;
  const hoverColor = active ? `${color}-30` : `gray-500`;

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
    hover ? `hover:via-${hoverColor}` : undefined,
    hover ? `hover:to-${colorTo}` : undefined,
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={`${classes} bg-gradient-to-t from-${colorFrom} via-${colorVia} to-${colorTo}`} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{children}</div>;
}
