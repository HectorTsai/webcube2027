import { jsx } from "hono/jsx/jsx-runtime";
import type { ButtonProps } from "./index.tsx";

export default function SolidButton({
  children,
  color = "primary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className
}: ButtonProps) {
  // 使用 UnoCSS 自訂 preset 的 classes
  const baseClasses = "btn";
  
  // 顏色類別
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
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
    "2xl": "px-10 py-5 text-2xl",
    "3xl": "px-12 py-6 text-3xl",
  };
  
  // 組合類別
  const finalClasses = [
    baseClasses,
    `bg-${color} text-${color}-content`,
    sizeClasses[size],
    "rounded-sm",
    "hover:opacity-90",
    "font-medium transition-all duration-200"
  ];
  
  // 添加額外類別
  if (className) {
    finalClasses.push(className);
  }
  
  // 禁用狀態
  if (disabled) {
    finalClasses.push("opacity-50 cursor-not-allowed");
  }
  
  const classes = finalClasses.filter(Boolean).join(" ");
  
  // 準備 Alpine.js 屬性
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
