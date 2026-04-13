import type { DrawerTitleProps } from "./index.tsx";

export default function DrawerTitle({
  children,
  className,
  ...restProps
}: DrawerTitleProps) {
  const finalClasses = [
    "text-lg",
    "font-bold",
    "w-full",
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  return (
    <div class={classes} {...restProps}>
      {children}
    </div>
  );
}
