import type { CardBodyProps } from "./index.tsx";

export default function CardBody({
  children,
  className,
  ...restProps
}: CardBodyProps) {
  return (
    <div class={className} {...restProps}>
      {children}
    </div>
  );
}