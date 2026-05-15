import type { FooterProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function Footer({
  children,
  variant = "solid",
  color = "primary",
  width = "100%",
  padding = "sm",
  sticky = false,
  className,
  context,
  ...restProps
}: FooterProps) {
  const stickyClasses = sticky ? "fixed bottom-0 left-0 right-0 z-50" : "";

  return (
    <Container
      variant={variant}
      color={color}
      width={width}
      padding={padding}
      rounded="none"
      shadow="none"
      direction="column"
      align="center"
      justify="center"
      gap="md"
      context={context}
      className={`${stickyClasses} ${className || ''}`.trim()}
      {...restProps}
    >
      {children}
    </Container>
  );
}