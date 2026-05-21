import type { HeroActionsProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function HeroActions({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: HeroActionsProps) {
  const finalClasses = [
    "flex flex-wrap gap-4 justify-center mt-8",
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