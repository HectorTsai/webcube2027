import type { ContainerProps } from "./index.tsx";
import { paddingClasses, marginClasses, alignClasses, justifyClasses, gapClasses, roundedClasses, shadowClasses, directionClasses } from "../classes.ts";
import { processChildren } from "../index.ts";

export default function DoubleContainer({
  children,
  direction = "column",
  color = "primary",
  variant,
  context,
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

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

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
  const activeFullClasses = `${baseClasses} bg-base border-4 border-double border-${color} text-${color} `;
  const activeHoverClasses = `${baseClasses} bg-${color}-70 border-4 border-double border-${color} text-${color}-content `;
  const inactiveFullClasses = `${baseClasses} bg-base border-4 border-double border-base-50 text-base-content `;
  const inactiveHoverClasses = `${baseClasses} bg-base-70 border-4 border-double border-base-50 text-base-content `;

  // 如果有 activeStateName，使用 Alpine.js store 動態控制 active 狀態
  if (activeStateName) {const initScript = `
      if(!Alpine.store('Container')){Alpine.store('Container',{})}
      if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}
    `.replace(/\s+/g, ' ').trim();

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
  const colorPrefix = active ? color : "base-50";
  const textColor = active ? `${color}` : `base-content`;
  const hoverColor = active ? `${color}-70` : `base-70`;

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
    "bg-base",
    `border-4 border-double border-${colorPrefix}`,
    `text-${textColor}`,
    hover ? `hover:bg-${hoverColor} hover:text-${textColor === color ? `${color}-content` : textColor}` : undefined,
    hover ? "transition-all duration-200" : undefined,
    roundedClasses[rounded]
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={classes} style={{ width: widthStyle, height: heightStyle }} {...restProps}>{processedChildren}</div>;
}