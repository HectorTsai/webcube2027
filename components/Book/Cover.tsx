import Icon from "../Icon.tsx";
export interface CoverProps {
  /** 封面標題 */
  title: string;
  /** SVG 圖示或裝飾 */
  icon?:string;
  svg?: string;
  src?:string;
  /** 子元素 */
  children?: unknown;
  /** 佈局變體 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 顏色主題 */
  color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default function Cover({
  title,
  icon,
  svg,
  src,
  children,
  variant,
  /** 顏色主題 */
  color = "primary",
  className = "",
  ...props
}: CoverProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "book-cover",
    "book-page",
    "box-border",
    `bg-${color}`,
    "flex flex-col items-center justify-center",
    "border-2 border-base-70",
    "shadow-lg",
    "p-8",
    "text-center",
    className
  ].filter(Boolean).join(" ");



  return (
    <div class={baseClasses} {...props}>
      {(icon || svg || src) && (
        <div class="mb-4">
          xxx
        </div>
      )}
      
      <h1 class="text-4xl font-bold text-base-content mb-4">
        {title}
      </h1>
      
      {children && (
        <div class="text-lg text-base-content/80">
          {children}
        </div>
      )}
      
      {/* 書脊效果 */}
      <div class="absolute right-0 top-0 w-4 h-full bg-gradient-to-r from-base-70/50 to-transparent"></div>
    </div>
  );
}
