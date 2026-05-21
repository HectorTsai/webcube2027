import {ComponentProps} from "./classes.ts";
import { processChildren } from "./index.ts";

export interface DividerProps extends ComponentProps {
  /** 是否水平 */
  horizontal?: boolean;
  /** 位置 */
  position?: "start" | "center" | "end";
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default function Divider({
  children,
  horizontal = false,
  color = "neutral",
  variant = "solid",
  position = "center",
  className,
  context,
  ...restProps
}: DividerProps) {
  const finalClasses = (base: string) => {
    return [base, className].filter(Boolean).join(" ");
  };

  const getBorderStyle = (dir: "top" | "left") => {
    return `border-${dir}: 2px solid oklch(var(--color-${color}) / 1)`;
  };

  const getTextClass = () => {
    if (color === "neutral") {
      return "text-base-content";
    }
    return `text-${color}-content`;
  };

  if (children) {
    // 處理 children，自動傳遞 color/variant/context
    const processedChildren = processChildren(children, { color, variant, context });

    if (horizontal) {
      return (
        <div class={finalClasses("flex flex-col items-center w-full my-4")} {...restProps}>
          <div style={getBorderStyle("left")} class={`h-full ${position === "start" ? "" : "flex-1"}`}></div>
          <span class={`py-4 text-sm ${getTextClass()}`}>{processedChildren}</span>
          <div style={getBorderStyle("left")} class={`h-full ${position === "end" ? "" : "flex-1"}`}></div>
        </div>
      );
    }
    return (
      <div class={finalClasses("flex flex-row items-center w-full my-4")} {...restProps}>
        <div style={getBorderStyle("top")} class={`w-full ${position === "start" ? "" : "flex-1"}`}></div>
        <span class={`px-4 text-sm ${getTextClass()}`}>{processedChildren}</span>
        <div style={getBorderStyle("top")} class={`w-full ${position === "end" ? "" : "flex-1"}`}></div>
      </div>
    );
  }

  if (horizontal) {
    return (
      <div style={getBorderStyle("left")} class={finalClasses("h-full mx-4")} {...restProps}></div>
    );
  }

  return (
    <div style={getBorderStyle("top")} class={finalClasses("w-full my-4")} {...restProps}></div>
  );
}
