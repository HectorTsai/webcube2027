import type { HeroTitleProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function HeroTitle({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: HeroTitleProps) {
  const finalClasses = [
    "text-4xl md:text-5xl lg:text-6xl font-bold leading-tight",
    className
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <h1 class={finalClasses} {...restProps}>
      {processedChildren}
    </h1>
  );
}