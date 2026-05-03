import type { HeroSubtitleProps } from "./index.tsx";

export default function HeroSubtitle({
  children,
  className,
  ...restProps
}: HeroSubtitleProps) {
  const finalClasses = [
    "text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed",
    className
  ].filter(Boolean).join(" ");

  return (
    <h2 class={finalClasses} {...restProps}>
      {children}
    </h2>
  );
}