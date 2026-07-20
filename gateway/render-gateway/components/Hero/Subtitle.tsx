import type { HeroSubtitleProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function HeroSubtitle({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: HeroSubtitleProps) {
  const finalClasses = [
    "text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed",
    className
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <h2 class={finalClasses} {...restProps}>
      {processedChildren}
    </h2>
  );
}