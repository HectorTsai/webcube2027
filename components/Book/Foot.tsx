export interface FootProps {
  /** 子元素 */
  children?: unknown;
  /** 版權資訊 */
  copyright?: string;
  /** 出版資訊 */
  publisher?: string;
  /** 額外 CSS 類別 */
  className?: string;
  color?:string;
  variant?:string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default function Foot({
  children,
  copyright,
  publisher,
  className = "",
  color = "base",
  variant = "solid",
  ...props
}: FootProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "book-foot",
    "book-page",
    "box-border",
    "flex flex-col items-center justify-center",
    `bg-${color}`,
    "border-2 border-base-70",
    "shadow-lg",
    "p-8",
    "text-center",
    className
  ].filter(Boolean).join(" ");

  return (
    <div class={baseClasses} {...props}>
      {/* 自定義內容 */}
      {children && (
        <div class="text-lg mb-4 mt-30vh">
          {children}
        </div>
      )}
      
      {/* 出版資訊 */}
      {publisher && (
        <div class="absolute bottom-15 w-full text-center">
          {publisher}
        </div>
      )}
      
      {/* 版權資訊 */}
      {copyright && (
        <div class="absolute bottom-10 w-full text-center text-xs">
          © {new Date().getFullYear()} {copyright}
        </div>
      )}
      
      {/* 書脊效果 */}
      <div class={`absolute left-0 top-0 w-4 h-full bg-gradient-to-r from-${color}-50/50 to-transparent`}></div>
    </div>
  );
}