import type { ListProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import { processChildren } from "../index.ts";

export default function List({
  color,
  children,
  divider = false,
  compact = false,
  className,
  context,
  ...restProps
}: ListProps) {
  const finalClasses = [
    "list",
    "w-full",
    "flex",
    "flex-col",
    "box-border",
    divider && "divide-y divide-base-200",
    compact && "p-0" || "p-1",
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  // 處理 children，自動傳遞 color/context
  const processedChildren = processChildren(children, { color, context });

  return <Container color={color} padding="none" width="full" context={context}>
    <ul class={classes} {...restProps}>{processedChildren}</ul>
  </Container>;
}