import type { MenuHeadProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function MenuHead({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: MenuHeadProps) {
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class={`flex items-center gap-1 ${className || ''}`} {...restProps}>
      {processedChildren}
    </div>
  );
}