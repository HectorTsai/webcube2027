import type { CardFootProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function CardFoot({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: CardFootProps) {
  const finalClasses = [
    "mt-auto pt-4 flex justify-end",
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