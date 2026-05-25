import type { CardTitleProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function CardTitle({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: CardTitleProps) {
  const finalClasses = [
    "text-xl font-semibold mb-2",
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