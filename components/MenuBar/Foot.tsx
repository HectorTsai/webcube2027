import type { MenuFootProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function MenuFoot({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: MenuFootProps) {
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class={`flex items-center gap-1 ${className || ''}`} {...restProps}>
      {processedChildren}
    </div>
  );
}