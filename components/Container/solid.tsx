import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses, color2TextColor, adjustColorLightOrOpacity } from "../classes.ts";
import { processChildren } from "../index.ts";

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
  context,
  variant,
  ...restProps}: ContainerProps) {

  const processedChildren = processChildren(children, { color, variant, context });
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
      shadowClasses[shadow],
      hover ? "transition-all duration-200" : undefined,
      className
    ].filter(Boolean).join(" ");

    // 完整類別（結構 + 顏色）
    const activeFullClasses = `${baseClasses} text-${color}-content bg-${color} `;
    const activeHoverClasses = `${baseClasses} bg-${color}-70 text-${color}-content `;
    const inactiveFullClasses = `${baseClasses} bg-base-70 text-base-content `;
    const inactiveHoverClasses = `${baseClasses} bg-base-50 text-base-content `;

    if (hover) {
      return (
        <div 
          x-data={`{ hover: false }`}
          x-init={initScript}
          x-on:mouseenter="hover = true"
          x-on:mouseleave="hover = false"
          x-bind:class={`$store.Container.${activeStateName} ? (hover ? '${activeHoverClasses}' : '${activeFullClasses}') : (hover ? '${inactiveHoverClasses}' : '${inactiveFullClasses}')`}
          style={{ width: widthStyle, height: heightStyle }}
          {...restProps}
        >
          {processedChildren}
        </div>
      );
    }

    return (
      <div 
        x-data
        x-init={initScript}
        x-bind:class={`$store.Container.${activeStateName} ? '${activeFullClasses}' : '${inactiveFullClasses}'`}
        style={{ width: widthStyle, height: heightStyle }}
        {...restProps}
      >
        {processedChildren}
      </div>
    );
  }

  // 沒有 activeStateName，使用原本的邏輯
  const colorPrefix = active ? color : "base-70";
  const textColor = color2TextColor(active ? color : "base");
  const hoverColor = adjustColorLightOrOpacity(active ? color : "base-70", 20, 0);

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

  return <div class={classes} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{processedChildren}</div>;
}