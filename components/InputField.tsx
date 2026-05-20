import {ComponentProps} from "./classes.ts";
import Container from "./Container/index.tsx";

export interface InputFieldProps extends ComponentProps {
}

export default function InputField({
  className,
  variant,
  color,
  context,
  children,
}: InputFieldProps) {
  return (
    <Container
      variant={variant}
      color={color}
      padding="none"
      rounded="sm"
      context={context}
      className={className}
    >
      <div class="flex items-center w-full">
        {children}
      </div>
    </Container>
  );
}
