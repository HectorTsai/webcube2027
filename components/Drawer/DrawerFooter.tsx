import type { DrawerFooterProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function DrawerFooter({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: DrawerFooterProps) {
  const finalClasses = [
    "flex",
    "flex-row",
    "items-center",
    "justify-end",
    "gap-sm",
    "w-full",
    "pt-sm",
    "mt-auto",
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
