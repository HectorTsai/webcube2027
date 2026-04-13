import type { DrawerFooterProps } from "./index.tsx";

export default function DrawerFooter({
  children,
  className,
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

  return (
    <div class={classes} {...restProps}>
      {children}
    </div>
  );
}
