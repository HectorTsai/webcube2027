import type { OptionItemProps } from "./index.tsx";

export default function OptionItem({
  value,
  children,
  disabled = false
}: OptionItemProps) {
  return (
    <div data-value={value} data-disabled={disabled}>
      {children}
    </div>
  );
}