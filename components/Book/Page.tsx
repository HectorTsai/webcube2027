export interface PageProps {
  /** 子元素 */
  children: unknown;
  /** 頁碼 */
  pageNumber?: number;
  /** 是否為奇數頁 (影響頁面佈局) */
  odd?: boolean;
  /** 額外 CSS 類別 */
  className?: string;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default function Page({
  children,
  pageNumber,
  odd = false,
  className = "",
  ...props
}: PageProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "book-page",
    "box-border",
    "flex flex-col",
    "bg-base",
    "border border-base-70",
    "shadow-sm",
    "p-6",
    className
  ].filter(Boolean).join(" ");

  return (
    <div class={baseClasses} {...props}>
      {/* 頁面內容 */}
      <div class="flex-1">
        {children}
      </div>
      
      {/* 頁碼 */}
      {pageNumber && (
        <div class={`absolute bottom-4 ${odd ? 'left-4' : 'right-4'} text-sm text-base-content/60`}>
          {pageNumber}
        </div>
      )}
      
      {/* 書頁邊緣效果 */}
      <div class="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-base-30/20 to-transparent"></div>
      <div class="absolute top-0 right-0 w-2 h-full bg-gradient-to-l from-base-30/20 to-transparent"></div>
    </div>
  );
}