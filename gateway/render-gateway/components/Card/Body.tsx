import type { CardBodyProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function CardBody({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: CardBodyProps) {
  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class={className} {...restProps}>
      {processedChildren}
    </div>
  );
}