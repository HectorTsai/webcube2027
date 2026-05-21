import type { MenuItemProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function MenuItem({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: MenuItemProps) {
  const finalClasses = [
    "flex",
    "items-center",
    "gap-2",
    "rounded-md",
    "transition-colors",
    "duration-200",
    "hover:bg-gray-300/30",
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return <li class={classes} {...restProps}>{processedChildren}</li>;
}
