import type { ListTitleProps } from "./index.tsx";

export default function ListTitle({
  children,
  className,
  ...restProps
}: ListTitleProps) {
  const finalClasses = [
    "px-4 py-2 text-md opacity-60 tracking-wide text-center",
    className
  ];
  const classes = finalClasses.filter(Boolean).join(" ");
  return <div class={classes} {...restProps}>{children}</div>;
}
