import type { ButtonProps } from "./index.tsx";

export default function GlowButton({
  children,
  color = "primary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className
}: ButtonProps) {  
  const colorClasses = {
    primary: "bg-primary text-primary-content",
    secondary: "bg-secondary text-secondary-content",
    accent: "bg-accent text-accent-content",
    info: "bg-info text-primary-content",
    success: "bg-success text-primary-content",
    warning: "bg-warning text-primary-content",
    error: "bg-error text-primary-content",
    danger: "bg-error text-primary-content",
  };
  
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
    `bg-${color} text-${color}-content`,
    "shadow-lg hover:shadow-xl hover:scale-105 transition-transform",
    `shadow-${color}`,
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
      class={classes}
      {...alpineProps}
    >
      {children}
    </button>
  );
}
