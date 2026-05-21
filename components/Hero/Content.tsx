import type { HeroContentProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function HeroContent({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: HeroContentProps) {
  const finalClasses = [
    "text-lg md:text-xl leading-relaxed max-w-2xl",
    className
  ].filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class={finalClasses} {...restProps}>
      {processedChildren}
    </div>
  );
}