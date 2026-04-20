import type { MenuItemProps } from "./index.tsx";

export default function MenuItem({
  children,
  className,
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

  return <li class={classes} {...restProps}>{children}</li>;
}
