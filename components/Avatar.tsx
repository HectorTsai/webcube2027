import {ComponentProps} from "./classes.ts";
import Icon from "./Icon.tsx";
import Image from "./Image.tsx";
import Container from "./Container/index.tsx";
import { sizeMap, textClasses } from "./classes.ts";

export interface AvatarProps extends ComponentProps {
  icon?: string;
  image?: string;
  src?: string;
  svg?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export default async function Avatar({
  icon,
  image,
  src,
  svg,
  size = "md",
  color = "primary",
  variant = "solid",
  className = "",
  context,
  ...restProps
}: AvatarProps) {
  const sizeValue = sizeMap[size] || sizeMap.md;
  let padding = "p-0";
  const textSize = textClasses[size];
  let content: unknown = null;
  switch(size){
    case "sm": padding="p-0.5";break;
    case "md": padding="p-1";break;
    case "lg": padding="p-1.5";break; 
    case "xl": padding="p-2";break;
    case "2xl": padding="p-2.5";break;
    case "3xl": padding="p-3";break;
    default: padding="p-0";break;
  }

  if (svg) {
    content = <Icon svg={svg} size={size} className={`w-full h-full ${padding}`} context={context} />;
  } else if (icon) {
    content = <Icon id={icon} size={size} className={`w-full h-full ${padding}`} context={context} />;
  } else if (image) {
    content = <Image id={image} width="100%" height="100%" objectFit="cover" className={`rounded-full ${padding}`} context={context} />;
  } else if (src) {
    content = <img src={src} alt="Avatar" className={`rounded-full w-full h-full object-cover ${padding}`} />;
  } else {
    content = (
      <div className={`w-full h-full flex items-center justify-center ${padding}`}>
        <span className={textSize}>?</span>
      </div>
    );
  }

  const finalClasses = [
    "!rounded-full",
    "p-1",
    className
  ];

  return (
    <Container
      direction="column"
      color={color}
      variant={variant}
      width={sizeValue}
      height={sizeValue}
      padding="none"
      margin="none"
      align="center"
      justify="center"
      gap="none"
      context={context}
      className={finalClasses.filter(Boolean).join(" ")}
      {...restProps}
    >
      {content as any}
    </Container>
  );
}
