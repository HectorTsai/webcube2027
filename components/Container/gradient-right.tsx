import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";

export default function GradientRightContainer({
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
  const activeFullClasses = `${baseClasses} bg-gradient-to-l from-${color} to-${color}-50 text-${color}-content ${hover ? `hover:to-${color}-30` : ''}`;
  const inactiveFullClasses = `${baseClasses} bg-gradient-to-l from-base-70 to-base-30 text-base-content ${hover ? `hover:to-base-10` : ''}`;

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
  const colorFrom = active ? color : `base-70`;
  const colorTo = active ? `${color}-50` : `base-30`;
  const textColor = active ? `${color}-content` : `base-content`;
  const hoverColor = active ? `${color}-30` : `base-10`;

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
    hover ? `hover:to-${hoverColor}` : undefined,
    hover ? "transition-all duration-200" : undefined,
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={`${classes} bg-gradient-to-l from-${colorFrom} to-${colorTo}`} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{children}</div>;
}