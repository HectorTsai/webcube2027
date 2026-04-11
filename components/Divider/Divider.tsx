import type { DividerProps } from "./index.tsx";

export default function Divider({
  children,
  horizontal = false,
  color = "neutral",
  position = "center",
  className,
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
    if (horizontal) {
      return (
        <div class={finalClasses("flex flex-col items-center w-full my-4")} {...restProps}>
          <div style={getBorderStyle("left")} class={`h-full ${position === "start" ? "" : "flex-1"}`}></div>
          <span class={`py-4 text-sm ${getTextClass()}`}>{children}</span>
          <div style={getBorderStyle("left")} class={`h-full ${position === "end" ? "" : "flex-1"}`}></div>
        </div>
      );
    }
    return (
      <div class={finalClasses("flex flex-row items-center w-full my-4")} {...restProps}>
        <div style={getBorderStyle("top")} class={`w-full ${position === "start" ? "" : "flex-1"}`}></div>
        <span class={`px-4 text-sm ${getTextClass()}`}>{children}</span>
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
