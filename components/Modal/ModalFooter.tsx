import type { ModalFooterProps } from "./index.tsx";

export default function ModalFooter({
  children,
  className,
  ...restProps
}: ModalFooterProps) {
  const finalClasses = [
    "flex",
    "flex-row",
    "items-center",
    "justify-end",
    "gap-sm",
    "w-full",
    "pt-sm",
    className
  ];

  const classes = finalClasses.filter(Boolean).join(" ");

  return (
    <div class={classes} {...restProps}>
      {children}
    </div>
  );
}
