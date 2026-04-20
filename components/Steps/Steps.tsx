import type { StepsProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Icon from "../Icon.tsx";

const colorLineMap: Record<string, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  neutral: "bg-neutral",
};

function getLineColor(active: boolean, completed: boolean, disabled: boolean, color: string, prevActive: boolean): string {
  if (disabled || (!active && !completed)) return "bg-gray-300";
  if (active && prevActive) return colorLineMap[color] || "bg-primary";
  if (completed && prevActive) return colorLineMap[color] || "bg-primary";
  return "bg-gray-300";
}
async function getCircleContent(child:any,index:number){
  if(child && child.props){
    if(child.props.completed) return "✓";
    if(child.props.text) return child.props.text;
    if(child.props.icon || child.props.src) return await Icon({id: child.props.icon, src: child.props.src, svg: child.props.svg});
  }
  return String(index+1);
}

export default async function Steps({
  children,
  vertical = false,
  className,
  color = "primary",
  variant = "solid",
}: StepsProps) {
  const childArray = Array.isArray(children) ? children : children ? [children] : [];
  if (vertical) {
    const items = await Promise.all(childArray.map(async (child, index) => {
      const childProps = (child as any).props || {};
      const isActive = childProps.active || false;
      const isCompleted = childProps.completed || false;
      const isDisabled = childProps.disabled || false;
      const childColor = childProps.color || color;
      const prevActive = index > 0 ? ((childArray[index - 1] as any).props?.active || (childArray[index - 1] as any).props?.completed || false) : false;

      // 使用 Container 函數
      const ContainerComponent = await Container({
        variant,
        color: childColor,
        width: "2rem",
        height: "2rem",
        active: isActive || isCompleted,
        align: "center",
        justify: "center",
        rounded: "sm",
        className: "shrink-0",
        children: await getCircleContent(child,index)
      });

      return (
        <li key={index} class="flex flex-row items-start py-0">
          <div class="flex flex-col items-center">
            {index > 0 && (
              <div class={`w-0.5 h-8 flex-shrink-0 ${getLineColor(
                isActive,
                isCompleted,
                isDisabled,
                childColor,
                prevActive
              )}`}></div>
            )}
            {ContainerComponent}
            {index < childArray.length - 1 && (
              <div class={`w-0.5 h-8 flex-shrink-0 ${getLineColor(
                (childArray[index + 1] as any).props?.active || false,
                (childArray[index + 1] as any).props?.completed || false,
                (childArray[index + 1] as any).props?.disabled || false,
                (childArray[index + 1] as any).props?.color || color,
                isActive || isCompleted
              )}`}></div>
            )}
          </div>
          <div class={`ml-4 mt-2 text-sm ${isDisabled ? "text-gray-400" : (isActive || isCompleted) ? "font-semibold" : ""}`}>
            {childProps.children}
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

  const items = await Promise.all(childArray.map(async (child, index) => {
    const childProps = (child as any).props || {};
    const isActive = childProps.active || false;
    const isCompleted = childProps.completed || false;
    const isDisabled = childProps.disabled || false;
    const childColor = childProps.color || color;
    const prevActive = index > 0 ? ((childArray[index - 1] as any).props?.active || (childArray[index - 1] as any).props?.completed || false) : false;

    // 使用 Container 函數
    const ContainerComponent = await Container({
      variant,
      color: childColor,
      width: "2rem",
      height: "2rem",
      active: isActive || isCompleted,
      align: "center",
      justify: "center",
      rounded: "sm",
      className: "shrink-0",
      children: await getCircleContent(child,index)
    });

    return (
      <li key={index} class="flex flex-col items-center flex-1">
        <div class="flex items-center w-full">
          <div class={`h-1 flex-1 ${index > 0 ? getLineColor(
            isActive,
            isCompleted,
            isDisabled,
            childColor,
            prevActive,
          ) : ""}`}></div>
          {ContainerComponent}
          <div class={`h-1 flex-1 ${index < childArray.length - 1 ? getLineColor(
            (childArray[index + 1] as any).props?.active || false,
            (childArray[index + 1] as any).props?.completed || false,
            (childArray[index + 1] as any).props?.disabled || false,
            (childArray[index + 1] as any).props?.color || color,
            isActive || isCompleted
          ) : ""}`}></div>
        </div>
        <div class={`mt-2 text-sm text-center ${isDisabled ? "text-gray-400" : (isActive || isCompleted) ? "font-semibold" : ""}`}>
          {childProps.children}
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