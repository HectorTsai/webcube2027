import type { StepProps } from "./index.tsx";

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

export default function Step({
  children,
  active = false,
  completed = false,
  disabled = false,
  color = "primary",
  icon,
  dataContent,
  className,
  index,
}: StepProps & { index?: number }) {
  const circleClasses = disabled ? disabledCircle : (active || completed) ? (colorCircleMap[color] || colorCircleMap.primary) : defaultCircle;
  const isColored = !disabled && (active || completed);
  const fontWeight = isColored ? "font-semibold" : "";

  const circleContent = icon ? icon : completed ? "✓" : index !== undefined ? String(index + 1) : "";

  const stepProps: Record<string, string> = {};
  if (dataContent) {
    stepProps["data-content"] = dataContent;
  }

  return (
    <li class={`step ${className || ""}`} {...stepProps}>
      <div class="flex flex-col items-center">
        <div class={`w-8 h-8 flex items-center justify-center rounded-full border-2 shrink-0 ${circleClasses}`}>
          {circleContent}
        </div>
        <div class={`mt-2 text-sm text-center ${disabled ? "text-gray-400" : (colorCircleMap[color]?.split(" ")[0] || "text-gray-500")} ${fontWeight}`}>
          {children}
        </div>
      </div>
    </li>
  );
}
