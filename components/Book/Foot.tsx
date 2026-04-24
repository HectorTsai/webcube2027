import Container from "../Container/index.tsx";
export interface FootProps {
  /** 子元素 */
  children?: unknown;
  /** 版權資訊 */
  copyright?: string;
  /** 出版資訊 */
  publisher?: string;
  /** 額外 CSS 類別 */
  className?: string;
  /** 佈局變體 */
  variant?: "solid" | "outline" | "ghost" | "dot" | "dashed" | 
           "gradient-right" | "gradient-left" | "gradient-up" | "gradient-down" | "gradient-middle" |
           "gradient-diagonal" | "gradient-center" | "gradient-cone" | "crystal" | "diagonal-stripes" | "glow" | "minimalist";
  /** 顏色主題 */
  color?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default function Foot({
  children,
  copyright,
  publisher,
  className = "",
  color,
  variant,
  ...props
}: FootProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "flex-col items-center justify-center",
    className
  ].filter(Boolean).join(" ");

  return (
    <div class="book-foot book-page box-border">
      <Container variant={variant} color={color} width="full" height="full" className={baseClasses} {...props}>
        {children && (<div class="text-lg">{children}</div>)}
      
        {/* 出版資訊 */}
        {publisher && (<div class="absolute bottom-15 w-full text-center">{publisher}</div>)}
      
        {/* 版權資訊 */}
        {copyright && (<div class="absolute bottom-10 w-full text-center text-xs">© {new Date().getFullYear()} {copyright}</div>)}
      </Container>
      {/* 書脊效果 */}
      <div class={`absolute left-0 top-0 bottom-0 rounded-lg w-8 bg-gradient-to-r from-${color}-50/50 via-transparent to-transparent`}></div>
    </div>
  );
}