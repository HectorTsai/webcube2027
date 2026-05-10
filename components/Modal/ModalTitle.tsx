import type { ModalTitleProps } from "./index.tsx";

export default function ModalTitle({
  children,
  className,
  ...restProps
}: ModalTitleProps) {
  const finalClasses = [
    "text-lg",
    "font-bold",
    "w-full",
    "pb-sm",
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  return (
    <div class={classes} {...restProps}>
      {children}
    </div>
  );
}
