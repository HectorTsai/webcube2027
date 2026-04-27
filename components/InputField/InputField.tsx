import type { InputFieldProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function InputField({
  className,
  variant,
  color,
  context,
  skeleton,
  children,
}: InputFieldProps) {
  return (
    <Container
      variant={variant}
      color={color}
      padding="none"
      rounded="sm"
      context={context}
      skeleton={skeleton}
      className={className}
    >
      <div class="flex items-center w-full">
        {children}
      </div>
    </Container>
  );
}
