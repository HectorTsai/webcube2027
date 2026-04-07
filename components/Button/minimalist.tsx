import type { ButtonProps } from "./index.tsx";

export default function MinimalistButton({
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
    "bg-white",
    "border border-solid border-gray-200",
    "shadow-sm",
    "rounded-sm",
    `text-${color}`,
    "hover:bg-gray-50",
    "hover:border-gray-300",
    "hover:shadow-md",
    "transition-all duration-200",
    sizeClasses[size],
  ];
  
  if (className) {
    finalClasses.push(className);
  }
  
  if (disabled) {
    finalClasses.push("opacity-50 cursor-not-allowed");
    finalClasses.push("hover:bg-white hover:border-gray-200 hover:shadow-sm");
  }
  
  const alpineProps: Record<string, string> = {};
  if (onClick) {
    alpineProps["x-on:click"] = onClick;
  }
  
  return (
    <button
      type={type}
      disabled={disabled}
      class={`${finalClasses.join(" ")}`}
      {...alpineProps}
    >
      {children}
    </button>
  );
}
