import type { HeroTitleProps } from "./index.tsx";

export default function HeroTitle({
  children,
  className,
  ...restProps
}: HeroTitleProps) {
  const finalClasses = [
    "text-4xl md:text-5xl lg:text-6xl font-bold leading-tight",
    className
  ].filter(Boolean).join(" ");

  return (
    <h1 class={finalClasses} {...restProps}>
      {children}
    </h1>
  );
}