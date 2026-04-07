import type { ButtonProps } from "./index.tsx";

export default function GradientUpButton({
  children,
  color = "primary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className
}: ButtonProps) {
  const baseClasses = "btn";
  
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
    baseClasses,
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
  
  const classes = finalClasses.filter(Boolean).join(" ");
  
  const alpineProps: Record<string, string> = {};
  if (onClick) {
    alpineProps['@click'] = onClick;
  }
  
  return (
    <button
      type={type}
      disabled={disabled}
      class={`${classes} bg-gradient-to-t from-${color}-10 to-${color}`}
      {...alpineProps}
    >
      {children}
    </button>
  );
}
