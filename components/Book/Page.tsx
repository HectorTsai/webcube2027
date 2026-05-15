import Container from "../Container/index.tsx";
import {ComponentProps} from "../classes.ts";
export interface PageProps extends ComponentProps {
  /** 頁碼 */
  pageNumber?: number;
  /** 是否為奇數頁 (影響頁面佈局) */
  odd?: boolean;
  /** Any additional props (including Alpine.js x- attributes and event handlers) */
  [key: string]: any;
}

export default function Page({
  children,
  pageNumber,
  odd = false,
  className = "",
  color,
  variant,
  context,
  ...props
}: PageProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "flex-col",
    className
  ].filter(Boolean).join(" ");
  
  const pageNumberClasses = [
    "absolute", 
    "bottom-4",
    odd ? 'left-4' : 'right-4',
    "text-sm",
  ].filter(Boolean).join(" ");
  const shadowClasses = [
    "absolute",
    "rounded-lg",
    "top-1",
    "bottom-1",
    "w-4",
    odd ? "left-0" : "right-0",
    odd ? "bg-gradient-to-r" : "bg-gradient-to-l",
    `from-${color}-50/50`,
    "via-transparent",
    "to-transparent",
  ].filter(Boolean).join(" ");
  const shadowClasses2 = [
    "absolute",
    "rounded-lg",
    "top-1",
    "bottom-1",
    "w-4",
    odd ? "right-0" : "left-0",
    odd ? "bg-gradient-to-l" : "bg-gradient-to-r",
    `from-${color}-50/50`,
    "via-transparent",
    "to-transparent",
  ].filter(Boolean).join(" ");

  return (
    <div class="book-page box-border">
      <Container color={color} variant={variant} width="full" height="full" className={baseClasses} context={context} {...props}>
        <div class="flex-1">{children}</div>
        {pageNumber && ( <div class={pageNumberClasses}>{pageNumber}</div>)}
      </Container>
      {/* 書頁邊緣效果 */}
      <div class={shadowClasses}></div>
      <div class={shadowClasses2}></div>
    </div>
  );
}