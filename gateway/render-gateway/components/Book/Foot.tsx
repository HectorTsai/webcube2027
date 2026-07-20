import Container from "../Container/index.tsx";
import {ComponentProps} from "../classes.ts";
import { processChildren } from "../index.ts";

export interface FootProps extends ComponentProps {
  /** 版權資訊 */
  copyright?: string;
  /** 出版資訊 */
  publisher?: string;
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
  context,
  ...props
}: FootProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "flex-col items-center justify-center",
    className
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class="book-foot book-page box-border">
      <Container variant={variant} color={`${color}-70`} width="full" height="full" className={baseClasses} context={context} {...props}>
        {children && (<div class="text-lg">{processedChildren}</div>)}
      
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