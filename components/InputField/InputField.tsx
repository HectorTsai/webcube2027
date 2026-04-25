import type { InputFieldProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function InputField({
  className,
  variant,
  color,
  children,
}: InputFieldProps) {
  return (
    <Container
      variant={variant}
      color={color}
      padding="none"
      rounded="sm"
      className={className}
    >
      <div class="flex items-center w-full">
        {children}
      </div>
    </Container>
  );
}
