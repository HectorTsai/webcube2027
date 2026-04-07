
export interface ButtonProps {
  children: unknown;
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" |
           "gradient-diagonal" | "gradient-circle" | "gradient-cone" | "glow";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  
  // Alpine.js 相關屬性
  onClick?: string; // Alpine.js 點擊事件
  className?: string; // 額外 CSS 類名
}

export default function Button({
  children,
  color = "primary",
  variant = "solid",
  size = "md",
  rounded = "md",
  disabled = false,
  type = "button",
  onClick,
  className
}: ButtonProps) {
  // 使用 UnoCSS 自訂 preset 的 classes
  const baseClasses = "btn";
  
  // 顏色類別 - 只定義顏色，不含風格
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
  
  // 風格類別 - 定義不同的視覺風格
  const variantClasses = {
    solid: "", // 預設實心
    outline: "bg-transparent border-2 hover:bg-current hover:text-current",
    ghost: "bg-transparent hover:bg-current",
    dot: "bg-transparent border-2 border-dotted hover:bg-current hover:text-current",
    dashed: "bg-transparent border-2 border-dashed hover:bg-current hover:text-current",
    double: "bg-transparent border-4 border-double hover:bg-current hover:text-current",
    gradient: "bg-gradient-to-r hover:opacity-90",
    glow: "shadow-lg hover:shadow-xl hover:scale-105 transition-transform",
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
  
  // 添加圓角類別
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm", 
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full"
  };
  
  // 組合類別
  const finalClasses = [baseClasses, sizeClasses[size]];
  
  // 根據風格組合顏色
  if (variant === "solid") {
    finalClasses.push(colorClasses[color]);
    finalClasses.push("hover:opacity-90");
  } else if (variant === "outline" || variant === "dot" || variant === "dashed" || variant === "double") {
    finalClasses.push(variantClasses[variant]);
    finalClasses.push(`border-${color} text-${color}`);
    finalClasses.push(`hover:bg-${color} hover:text-primary-content`);
  } else if (variant === "ghost") {
    finalClasses.push(variantClasses["ghost"]);
    finalClasses.push(`!text-gray-800`);
    finalClasses.push(`dark:!text-gray-200`);
    finalClasses.push(`hover:bg-${color} hover:text-${color}-content`);
  } else if (variant === "glow") {
    finalClasses.push(colorClasses[color]);
    finalClasses.push(variantClasses["glow"]);
    finalClasses.push(`shadow-${color}`);
  }
  
  // 添加圓角和通用樣式
  finalClasses.push(roundedClasses[rounded]);
  finalClasses.push("font-medium transition-all duration-200");
  
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
