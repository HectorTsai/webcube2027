import type { ModalTitleProps } from "./index.tsx";
import { processChildren } from "../index.ts";

export default function ModalTitle({
  children,
  className,
  color,
  variant,
  context,
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

  // 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  return (
    <div class={classes} {...restProps}>
      {processedChildren}
    </div>
  );
}
