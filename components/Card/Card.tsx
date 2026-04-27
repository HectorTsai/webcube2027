import type { CardProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function Card({
  variant = "solid",
  color = "primary",
  direction = "column",
  padding = "md",
  margin = "none",
  align = "start",
  justify = "start",
  gap = "none",
  children,
  className,
  context,
  skeleton,
  ...restProps
}: CardProps) {
  const finalClasses = [
    className
  ];
  
  const classes = finalClasses.filter(Boolean).join(" ");

  return <Container 
    variant={variant} 
    color={color}
    direction={direction}
    width="auto"
    height="auto"
    padding={padding}
    margin={margin}
    align={align}
    justify={justify}
    gap={gap}
    rounded="lg"
    shadow="md"
    context={context}
    skeleton={skeleton}
    className={classes}
    {...restProps}
  >
    {children}
  </Container>;
}
