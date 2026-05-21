import {ComponentProps} from "./classes.ts";
import Container from "./Container/index.tsx";
import { processChildren } from "./index.ts";

export interface InputFieldProps extends ComponentProps {
}

export default function InputField({
  className,
  variant,
  color,
  context,
  children,
}: InputFieldProps) {
  const processedChildren = processChildren(children, { color, variant, context });
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
        {processedChildren}
      </div>
    </Container>
  );
}
