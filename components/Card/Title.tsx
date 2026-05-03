import type { CardTitleProps } from "./index.tsx";

export default function CardTitle({
  children,
  className,
  ...restProps
}: CardTitleProps) {
  const finalClasses = [
    "text-xl font-semibold mb-2",
    className
  ].filter(Boolean).join(" ");

  return (
    <h3 class={finalClasses} {...restProps}>
      {children}
    </h3>
  );
}