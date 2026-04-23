import Icon from "../Icon.tsx";
import Container from "../Container/index.tsx";
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
  color?: string;
  /** 額外 CSS 類別 */
  className?: string;
  context:any;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default async function Cover({
  title,
  icon,
  svg,
  src,
  children,
  /** 顏色主題 */
  color = "base-70",
  className = "",
  context,
  ...props
}: CoverProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "book-cover",
    "book-page",
    "box-border",
    className
  ].filter(Boolean).join(" ");



  return (
    <div class={baseClasses} >
      <Container color={color} width="full" height="full" {...props}>
        {(icon || svg || src) && (
          <div class="mb-4 mt-30vh">
            <Icon id={icon} svg={svg} src={src} size="4xl" context={context} />
          </div>
        )}
        
        <h1 class="text-4xl font-bold mb-4">
          {title}
        </h1>
        
        {children && (
          <div class="text-lg">
            {children}
          </div>
        )}
        
        {/* 書脊效果 */}
        <div class={`absolute right-1 top-0 rounded-sm h-full w-2 bg-gradient-to-l from-${color}-50/50 to-transparent`}></div>
      </Container>
    </div>
  );
}
