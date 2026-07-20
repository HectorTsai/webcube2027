import type { DrawerTitleProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function DrawerTitle({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: DrawerTitleProps) {
  const finalClasses = [
    "text-lg",
    "font-bold",
    "w-full",
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class={classes} {...restProps}>
      {processedChildren}
    </div>
  );
}
