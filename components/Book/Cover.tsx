import Icon from "../Icon.tsx";
import Container from "../Container/index.tsx";
import {ComponentProps} from "../classes.ts";
import { processChildren } from "../index.ts";
export interface CoverProps extends ComponentProps {
  /** 封面標題 */
  title: string;
  /** SVG 圖示或裝飾 */
  icon?:string;
  svg?: string;
  src?:string;
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
  color,
  variant,
  className = "",
  context,
  ...props
}: CoverProps) {
  
  // 生成 CSS 類別
  const baseClasses = [
    "flex-col items-center justify-center",
    className
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class="book-cover book-page box-border" >
      <Container color={`${color}-70`} variant={variant} width="full" height="full" className={baseClasses} context={context} {...props}>
        {(icon || svg || src) && (
          <div class="mb-4">
            <Icon id={icon} svg={svg} src={src} size="4xl" context={context} />
          </div>
        )}
        
        <div class="text-4xl font-bold mt-4">{title}</div>
        {children && (<div class="text-lg">{processedChildren}</div>)}
        
        {/* 書脊效果 */}
        <div class={`absolute right-0 top-0 bottom-0 rounded-lg w-8 bg-gradient-to-l from-${color}-50/50 via-transparent to-transparent`}></div>
      </Container>
    </div>
  );
}
