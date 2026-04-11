import type { ListRowProps } from "./index.tsx";

export default function ListRow({
  children,
  className,
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

  return <li class={classes} {...restProps}>{children}</li>;
}
