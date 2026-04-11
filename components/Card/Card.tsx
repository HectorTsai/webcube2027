import type { CardProps } from "./index.tsx";
import Container from "../Container/index.tsx";

export default function Card({
  variant = "solid",
  color = "primary",
  direction = "column",
  width = "full",
  padding = "md",
  margin = "none",
  align = "start",
  justify = "start",
  gap = "none",
  children,
  className,
  ...restProps
}: CardProps) {
  const finalClasses = [
    "!rounded-xl",
    "!shadow-md",
    className
  ];
  
  const classes = finalClasses.filter(Boolean).join(" ");

  return <Container 
    variant={variant} 
    color={color}
    direction={direction}
    width={width}
    padding={padding}
    margin={margin}
    align={align}
    justify={justify}
    gap={gap}
    className={classes}
    {...restProps}
  >
    {children}
  </Container>;
}
