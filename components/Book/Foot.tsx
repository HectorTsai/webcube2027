export interface FootProps {
  /** 子元素 */
  children?: unknown;
  /** 版權資訊 */
  copyright?: string;
  /** 出版資訊 */
  publisher?: string;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default function Foot({
  children,
  copyright,
  publisher,
  className = "",
  ...props
}: FootProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "book-foot",
    "book-page",
    "box-border",
    "flex flex-col items-center justify-center",
    "bg-gradient-to-br from-base to-base-70",
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
        <div class="text-lg text-base-content/80 mb-4">
          {children}
        </div>
      )}
      
      {/* 出版資訊 */}
      {publisher && (
        <div class="text-sm text-base-content/60 mb-2">
          {publisher}
        </div>
      )}
      
      {/* 版權資訊 */}
      {copyright && (
        <div class="text-xs text-base-content/40">
          © {new Date().getFullYear()} {copyright}
        </div>
      )}
      
      {/* 書脊效果 */}
      <div class="absolute left-0 top-0 w-4 h-full bg-gradient-to-r from-base-70/50 to-transparent"></div>
    </div>
  );
}