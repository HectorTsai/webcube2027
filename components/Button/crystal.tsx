import type { ButtonProps } from "./index.tsx";

export default function CrystalButton({
  children,
  color = "primary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className
}: ButtonProps) {
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py- text-md",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
    "2xl": "px-10 py-5 text-2xl",
    "3xl": "px-12 py-6 text-3xl",
  };
  
  const finalClasses = [
    "btn",
    "border-0",
    `text-${color}-content`,
    "hover:opacity-90",
    sizeClasses[size],
    "rounded-sm",
    "font-medium transition-all duration-200"
  ];
  
  if (className) {
    finalClasses.push(className);
  }
  
  if (disabled) {
    finalClasses.push("opacity-50 cursor-not-allowed");
  }
  
  const alpineProps: Record<string, string> = {};
  if (onClick) {
    alpineProps["x-on:click"] = onClick;
  }
  
  return (
    <button
      type={type}
      disabled={disabled}
      class={`${finalClasses.join(" ")} bg-gradient-to-t from-${color} via-${color}-50 to-${color} relative overflow-hidden`}
      {...alpineProps}
    >
      <div class={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-gray-100 to-gray-100/40`}></div>
      {/* 內容層 */}
      <span class="relative z-10 text-${color}-content">{children}</span>
    </button>
  );
}
