import type { ListTitleProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function ListTitle({
  children,
  className,
  color,
  variant,
  context,
  ...restProps
}: ListTitleProps) {
  const finalClasses = [
    "px-4 py-2 text-md opacity-60 tracking-wide text-center",
    className
  ];
  const classes = finalClasses.filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return <div class={classes} {...restProps}>{processedChildren}</div>;
}
