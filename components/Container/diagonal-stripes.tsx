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
  activeStateName,
  hover = false,
  className,
  ...restProps}: ContainerProps) {

  const widthStyle = (width === "full" || width === "auto") ? undefined : width;
  const heightStyle = (height === "full" || height === "auto") ? undefined : height;
  const widthClass = (width === "full" || width === "auto") ? `w-${width}` : undefined;
  const heightClass = (height === "full" || height === "auto") ? `h-${height}` : undefined;

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

  // 漸層樣式
  const activeGradient = `repeating-linear-gradient(45deg, oklch(var(--color-${color})/1) 0px, oklch(var(--color-${color})/1) 10px, oklch(var(--color-${color}-light-70)/1) 10px, oklch(var(--color-${color}-light-70)/1) 20px)`;
  const inactiveGradient = `repeating-linear-gradient(45deg, oklch(var(--color-base)/1) 0px, oklch(var(--color-base)/1) 10px, oklch(var(--color-base-light-70)/1) 10px, oklch(var(--color-base-light-70)/1) 20px)`;
  const activeHoverGradient = `repeating-linear-gradient(-45deg, oklch(var(--color-${color})/1) 0px, oklch(var(--color-${color})/1) 10px, oklch(var(--color-${color}-light-70)/1) 10px, oklch(var(--color-${color}-light-70)/1) 20px)`;
  const inactiveHoverGradient = `repeating-linear-gradient(-45deg, oklch(var(--color-base)/1) 0px, oklch(var(--color-base)/1) 10px, oklch(var(--color-base-light-70)/1) 10px, oklch(var(--color-base-light-70)/1) 20px)`;
  const activeTextColor = `${color}-content`;
  const inactiveTextColor = `base-content`;

  // 如果有 activeStateName，使用 Alpine.js store 動態控制 active 狀態
  if (activeStateName) {
    const initScript = `
      if(!Alpine.store('Container')){Alpine.store('Container',{})}
      if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}
    `.replace(/\s+/g, ' ').trim();

    const activeFullClasses = `${baseClasses} text-${activeTextColor}`;
    const inactiveFullClasses = `${baseClasses} text-${inactiveTextColor}`;

    if (hover) {
      return (
        <div
          x-data={`{ hover: false, active: $store.Container.${activeStateName} }`}
          x-init={initScript}
          x-on:mouseenter="hover = true"
          x-on:mouseleave="hover = false"
          x-bind:class={`$store.Container.${activeStateName} ? '${activeFullClasses}' : '${inactiveFullClasses}'`}
          x-bind:style="() => {
            const isActive = $store.Container.${activeStateName};
            const gradient = isActive ? '${activeGradient}' : '${inactiveGradient}';
            const hoverGradient = isActive ? '${activeHoverGradient}' : '${inactiveHoverGradient}';
            return { backgroundImage: hover ? hoverGradient : gradient };
          }"
          style={{ width: widthStyle, height: heightStyle }}
          {...restProps}
        >
          {children}
        </div>
      );
    }

    return (
      <div 
        x-data
        x-init={initScript}
        x-bind:class={`$store.Container.${activeStateName} ? '${activeFullClasses}' : '${inactiveFullClasses}'`}
        x-bind:style="() => ({ backgroundImage: $store.Container.${activeStateName} ? '${activeGradient}' : '${inactiveGradient}' })"
        style={{ width: widthStyle, height: heightStyle }}
        {...restProps}
      >
        {children}
      </div>
    );
  }

  // 沒有 activeStateName，使用原本的邏輯
  const colorPrefix = active ? color : `base`;
  const textColor = active ? `${color}-content` : `base-content`;

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