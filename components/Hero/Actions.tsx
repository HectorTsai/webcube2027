import type { HeroActionsProps } from "./index.tsx";

export default function HeroActions({
  children,
  className,
  ...restProps
}: HeroActionsProps) {
  const finalClasses = [
    "flex flex-wrap gap-4 justify-center mt-8",
    className
  ].filter(Boolean).join(" ");

  return (
    <div class={finalClasses} {...restProps}>
      {children}
    </div>
  );
}