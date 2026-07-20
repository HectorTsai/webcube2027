import type { TimelineProps } from "./index.tsx";
import { cloneElement } from "hono/jsx";
import TimelineItem from "./TimelineItem.tsx";

// 线条颜色统一使用 base-50
const lineColor = "bg-base-50";

export default async function Timeline({
  children,
  vertical = false,
  animate,
  className,
  color = "primary",
  variant = "solid",
  context,
}: TimelineProps) {
  const childArray = Array.isArray(children) ? children : children ? [children] : [];
  
  // 將 variant/color/context 傳遞給 TimelineItem 子元件
  const processedChildren = childArray.map((child: any) => {
    if (child?.type === TimelineItem) {
      return cloneElement(child, {
        variant: child.props.variant ?? variant,
        color: child.props.color ?? color,
        context: child.props.context ?? context,
      });
    }
    return child;
  });

  if (vertical) {
    const items = await Promise.all(processedChildren.map(async (child, index) => {
      const childProps = (child as any).props || {};

      // 获取内容：优先使用 end，其次是 children
      const content = childProps.end !== undefined ? childProps.end : childProps.children;
      // 获取 start（年份/时间）
      const start = childProps.start;
      
      return (
        <li key={index} class="grid grid-cols-[auto_1fr] gap-4">
          {/* 左侧区域：时间 + 线条 */}
          <div class="flex flex-row items-center">
            {/* 时间 */}
            {start && (
              <div class="text-right pr-4 w-20 shrink-0">
                <div class={`font-semibold text-sm ${animate || ""}`}>{start}</div>
              </div>
            )}
            {/* 线条和图标 */}
            <div class="flex flex-col items-center relative h-full min-h-[3rem]">
              {/* 上部分线条 */}
              {index > 0 && (
                <div class={`w-1 flex-1 ${lineColor}`}></div>
              )}
              {!index && <div class="flex-1"></div>}
              {/* 图标 */}
              <div class="relative z-10 py-1">
                {child}
              </div>
              {/* 下部分线条 */}
              {index < childArray.length - 1 && (
                <div class={`w-1 flex-1 ${lineColor}`}></div>
              )}
              {index === childArray.length - 1 && <div class="flex-1"></div>}
            </div>
          </div>
          {/* 右侧：内容 */}
          <div class={`flex items-center py-2 ${animate || ""}`}>
            {content}
          </div>
        </li>
      );
    }));

    return (
      <ul class={`flex flex-col list-none p-0 m-0 ${className || ""}`}>
        {items}
      </ul>
    );
  }

  const items = await Promise.all(processedChildren.map(async (child, index) => {
    const childProps = (child as any).props || {};

    return (
      <li key={index} class="flex flex-col items-center flex-1">
        {/* 上部内容 */}
        <div class={`text-center mb-2 w-full ${animate || ""}`}>
          {childProps.start}
        </div>
        {/* 线条和图标 */}
        <div class="flex items-center w-full">
          {/* 第一个项目左边用透明线条占位，让圆圈往内缩但不显示线条 */}
          {index === 0 ? (
            <div class="h-1 flex-1 bg-transparent"></div>
          ) : (
            <div class={`h-1 flex-1 ${lineColor}`}></div>
          )}
          <div class="relative z-10 flex-shrink-0 mx-2">
            {child}
          </div>
          {/* 最后一个项目右边用透明线条占位，让圆圈往内缩但不显示线条 */}
          {index === childArray.length - 1 ? (
            <div class="h-1 flex-1 bg-transparent"></div>
          ) : (
            <div class={`h-1 flex-1 ${lineColor}`}></div>
          )}
        </div>
        {/* 下部内容 */}
        <div class={`text-center mt-2 w-full ${animate || ""}`}>
          {childProps.end || childProps.children}
        </div>
      </li>
    );
  }));


  return (
    <ul class={`flex flex-row list-none p-0 m-0 ${className || ""}`}>
      {items}
    </ul>
  );
}