import type { ListRowProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function ListRow({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: ListRowProps) {
  const finalClasses = [
    "list-row",
    "flex",
    "items-center",
    "gap-4",
    "p-4",
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
