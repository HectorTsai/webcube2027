/*
 * Container 容器元件
 * 提供主題一致的容器樣式，自動套用顏色、圓角和視覺風格
 * 與 Button 組件保持一致的 variant 系統
 */

export interface ContainerProps {
  /** Child elements to render inside the container */
  children: unknown;
  /** Flex direction - controls layout orientation */
  direction?: "row" | "column";
  /** Cross-axis alignment - controls vertical positioning */
  align?: "start" | "center" | "end" | "stretch";
  /** Main-axis alignment - controls horizontal positioning */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** 顏色主題 - 自動設定背景色和文字色 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error" | "danger";
  /** 視覺風格 - 與 Button 保持一致，加上多種漸層選項 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | "double" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" |
           "gradient-diagonal" | "gradient-circle" | "gradient-cone" | "glow";
  /** Additional CSS classes - can include width, gap, padding, etc. */
  className?: string;
  /** Inline styles - for gradient and other custom styles */
  style?: string;
}

export default function Container({
  children,
  direction = "column",
  align = "stretch",
  justify = "start",
  color,
  variant = "solid",
  className = "",
  style = "",
}: ContainerProps) {
  const baseClasses = "flex";
  
  // 方向類別
  const directionClasses = {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
  };
  
  // 對齊類別
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };
  
  // 分散類別
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };
  
  // 組合基本佈局類別
  const finalClasses = [
    baseClasses,
    directionClasses[direction],
    alignClasses[align],
    justifyClasses[justify],
    "rounded-md" // 自動套用主題預設圓角
  ];
  
  // 處理顏色和風格
  if (color && variant) {
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
    
    // 風格類別 - 與 Button 保持一致
    const variantClasses = {
      solid: "", // 預設實心
      outline: "bg-transparent border-2",
      ghost: "bg-transparent",
      dot: "bg-transparent border-2 border-dotted",
      dashed: "bg-transparent border-2 border-dashed",
      double: "bg-transparent border-4 border-double",
      gradient: "bg-gradient-to-r hover:opacity-90",
      glow: "shadow-lg hover:shadow-xl hover:scale-105 transition-transform",
    };
    
    // 根據風格組合顏色
    if (variant === "solid") {
      finalClasses.push(colorClasses[color]);
      finalClasses.push("hover:opacity-90");
    } else if (variant === "outline" || variant === "dot" || variant === "dashed" || variant === "double") {
      finalClasses.push(variantClasses[variant]);
      finalClasses.push(`border-${color} text-${color}`);
      finalClasses.push(`hover:bg-${color} hover:text-${color}-content`);
    } else if (variant === "ghost") {
      finalClasses.push(variantClasses["ghost"]);
      finalClasses.push(`text-${color}`);
      finalClasses.push(`hover:bg-${color} hover:text-primary-content`);
    } else if (variant.startsWith("gradient-")) {
      // 多種漸層類型 - 不依賴 UnoCSS
      const gradientColors: Record<string, string> = {
        primary: "oklch(0.7 0.15 260), oklch(0.5 0.2 260)",
        secondary: "oklch(0.6 0.12 290), oklch(0.4 0.15 290)",
        accent: "oklch(0.65 0.2 150), oklch(0.45 0.25 150)",
        info: "oklch(0.7 0.15 200), oklch(0.5 0.2 200)",
        success: "oklch(0.7 0.15 120), oklch(0.5 0.2 120)",
        warning: "oklch(0.8 0.15 80), oklch(0.6 0.2 80)",
        error: "oklch(0.7 0.2 25), oklch(0.5 0.25 25)",
        danger: "oklch(0.7 0.2 25), oklch(0.5 0.25 25)",
      };
      
      const colors = gradientColors[color] || gradientColors.primary;
      let gradientStyle = "";
      
      switch (variant) {
        case "gradient-right":
          gradientStyle = `background: linear-gradient(to right, ${colors});`;
          break;
        case "gradient-left":
          gradientStyle = `background: linear-gradient(to left, ${colors});`;
          break;
        case "gradient-up":
          gradientStyle = `background: linear-gradient(to top, ${colors});`;
          break;
        case "gradient-down":
          gradientStyle = `background: linear-gradient(to bottom, ${colors});`;
          break;
        case "gradient-diagonal":
          gradientStyle = `background: linear-gradient(45deg, ${colors});`;
          break;
        case "gradient-circle":
          gradientStyle = `background: radial-gradient(circle, ${colors});`;
          break;
        case "gradient-cone":
          gradientStyle = `background: conic-gradient(from 0deg, ${colors});`;
          break;
        default:
          gradientStyle = `background: linear-gradient(to right, ${colors});`;
      }
      
      finalClasses.push("text-white");
      finalClasses.push("hover:opacity-90");
      
      const classes = `${baseClasses} ${directionClasses[direction]} ${alignClasses[align]} ${justifyClasses[justify]} rounded-md ${finalClasses.filter(Boolean).join(" ")} ${className}`.trim();
      
      return <div class={classes} style={gradientStyle}>{children}</div>;
    } else if (variant === "glow") {
      finalClasses.push(colorClasses[color]);
      finalClasses.push(variantClasses["glow"]);
      finalClasses.push(`shadow-${color}`);
    }
  } else {
    // 沒有顏色時，使用預設背景
    finalClasses.push("bg-base-100 text-base-content");
  }
  
  // 添加額外類別
  if (className) {
    finalClasses.push(className);
  }
  
  const classes = finalClasses.filter(Boolean).join(" ");

  return <div class={classes}>{children}</div>;
}
