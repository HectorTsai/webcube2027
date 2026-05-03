import type { HeroContentProps } from "./index.tsx";

export default function HeroContent({
  children,
  className,
  ...restProps
}: HeroContentProps) {
  const finalClasses = [
    "text-lg md:text-xl leading-relaxed max-w-2xl",
    className
  ].filter(Boolean).join(" ");

  return (
    <div class={finalClasses} {...restProps}>
      {children}
    </div>
  );
}