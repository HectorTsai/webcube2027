import type { StepsProps } from "./index.tsx";
import Container from "../Container/index.tsx";

const colorCircleMap: Record<string, string> = {
  primary: "bg-primary text-primary-content border-primary",
  secondary: "bg-secondary text-secondary-content border-secondary",
  accent: "bg-accent text-accent-content border-accent",
  info: "bg-info text-info-content border-info",
  success: "bg-success text-success-content border-success",
  warning: "bg-warning text-warning-content border-warning",
  error: "bg-error text-error-content border-error",
  neutral: "bg-neutral text-neutral-content border-neutral",
};

const defaultCircle = "bg-gray-200 text-gray-600 border-gray-300";
const disabledCircle = "bg-gray-300 text-gray-400 border-gray-300";

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

function getCircleClasses(active: boolean, completed: boolean, disabled: boolean, color: string): string {
  if (disabled) return disabledCircle;
  if (active || completed) {
    return colorCircleMap[color] || colorCircleMap.primary;
  }
  return defaultCircle;
}

function getLineColor(active: boolean, completed: boolean, disabled: boolean, color: string, prevActive: boolean): string {
  if (disabled || (!active && !completed)) {
    return "bg-gray-300";
  }
  if (active && prevActive) {
    return colorLineMap[color] || "bg-primary";
  }
  return "bg-gray-300";
}

export default function Steps({
  children,
  vertical = false,
  className,
  variant = "solid",
}: StepsProps) {
  const childArray = Array.isArray(children) ? children : children ? [children] : [];

  if (vertical) {
    return (
      <ul class={`flex flex-col list-none p-0 m-0 ${className || ""}`}>
        {childArray.map((child, index) => {
          const childProps = (child as any).props || {};
          const isActive = childProps.active || false;
          const isCompleted = childProps.completed || false;
          const isDisabled = childProps.disabled || false;
          const childColor = childProps.color || "primary";
          const circleClasses = getCircleClasses(isActive, isCompleted, isDisabled, childColor);
          const circleContent = childProps.icon ? childProps.icon : (isCompleted ? "✓" : (childProps.index !== undefined ? String(childProps.index + 1) : ""));
          const prevActive = index > 0 ? ((childArray[index - 1] as any).props?.active || false) : false;

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
                <Container 
                  variant={variant} 
                  color={childColor} 
                  width="2rem" 
                  height="2rem" 
                  active={isActive || isCompleted}
                  align="center" 
                  justify="center" 
                  rounded="sm"
                  className={`flex items-center border-2 shrink-0 rounded-full ${circleClasses}`}
                >
                  {circleContent}
                </Container>
                {index < childArray.length - 1 && (
                  <div class={`w-0.5 h-8 flex-shrink-0 ${getLineColor(
                    (childArray[index + 1] as any).props?.active || false,
                    (childArray[index + 1] as any).props?.completed || false,
                    (childArray[index + 1] as any).props?.disabled || false,
                    (childArray[index + 1] as any).props?.color || "primary",
                    isActive
                  )}`}></div>
                )}
              </div>
              <div class={`ml-4 mt-2 text-sm ${isDisabled ? "text-gray-400" : (isActive || isCompleted) ? "font-semibold" : ""}`}>
                {childProps.children}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul class={`flex flex-row list-none p-0 m-0 ${className || ""}`}>
      {childArray.map((child, index) => {
        const childProps = (child as any).props || {};
        const isActive = childProps.active || false;
        const isCompleted = childProps.completed || false;
        const isDisabled = childProps.disabled || false;
        const childColor = childProps.color || "primary";
        const circleClasses = getCircleClasses(isActive, isCompleted, isDisabled, childColor);
        const circleContent = childProps.icon ? childProps.icon : (isCompleted ? "✓" : (childProps.index !== undefined ? String(childProps.index + 1) : ""));
        const prevActive = index > 0 ? ((childArray[index - 1] as any).props?.active || false) : false;

        return (
          <li key={index} class="flex flex-col items-center flex-1">
            <div class="flex items-center w-full">
              <div class={`h-0.5 flex-1 ${index > 0 ? getLineColor(
                isActive,
                isCompleted,
                isDisabled,
                childColor,
                prevActive
              ) : ""}`}></div>
              <Container 
                variant={variant} 
                color={childColor} 
                width="2rem" 
                height="2rem" 
                active={isActive || isCompleted}
                align="center" 
                justify="center" 
                rounded="sm"
                className={`flex items-center shrink-0 rounded-full ${circleClasses}`}
              >
                {circleContent}
              </Container>
              <div class={`h-0.5 flex-1 ${index < childArray.length - 1 ? getLineColor(
                (childArray[index + 1] as any).props?.active || false,
                (childArray[index + 1] as any).props?.completed || false,
                (childArray[index + 1] as any).props?.disabled || false,
                (childArray[index + 1] as any).props?.color || "primary",
                isActive
              ) : ""}`}></div>
            </div>
            <div class={`mt-2 text-sm text-center ${isDisabled ? "text-gray-400" : (isActive || isCompleted) ? "font-semibold" : ""}`}>
              {childProps.children}
            </div>
          </li>
        );
      })}
    </ul>
  );
}