import type { ListProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function List({
  color = "ghost",
  variant = "solid",
  children,
  divider = false,
  compact = false,
  className,
  ...restProps
}: ListProps) {
  const finalClasses = [
    "list",
    "w-full",
    "flex",
    "flex-col",
    divider && "divide-y divide-base-200",
    compact && "p-0" || "p-1",
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  return <Container variant={variant} color={color} padding="none">
    <ul class={classes} {...restProps}>{children}</ul>
  </Container>;
}
