import type { CardFootProps } from "./index.tsx";

export default function CardFoot({
  children,
  className,
  ...restProps
}: CardFootProps) {
  const finalClasses = [
    "mt-auto pt-4 flex justify-end",
    className
  ].filter(Boolean).join(" ");

  return (
    <div class={finalClasses} {...restProps}>
      {children}
    </div>
  );
}