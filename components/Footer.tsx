import {ComponentProps} from "./classes.ts";
import Container from "./Container/index.tsx";

export interface FooterProps extends ComponentProps {
  /** 寬度設定 */
  width?: string;
  /** 內距 */
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** 圓角 */
  rounded?: "none" | "sm" | "md" | "lg";
  /** 陰影 */
  shadow?: "none" | "sm" | "md" | "lg";
  /** 是否固定在底部 */
  sticky?: boolean;
  /** Any additional props */
  [key: string]: any;
}

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