import type { AvatarProps } from "./index.tsx";
import Icon from "../Icon.tsx";
import Image from "../Image.tsx";
import Container from "../Container/index.tsx";
import { sizeMap } from "../classes.ts";

export default async function Avatar({
  icon,
  image,
  src,
  svg,
  size = "md",
  color = "primary",
  variant = "solid",
  className = "",
  skeleton,
  context,
  ...restProps
}: AvatarProps) {
  const sizeValue = sizeMap[size] || sizeMap.md;

  let content: unknown = null;

  if (svg) {
    content = <Icon svg={svg} size={size} className={`w-full h-full`} context={context} />;
  } else if (icon) {
    content = <Icon id={icon} size={size} className={`w-full h-full`} context={context} />;
  } else if (image) {
    content = <Image id={image} width="100%" height="100%" className={`w-full h-full`} context={context} />;
  } else if (src) {
    content = <img src={src} alt="Avatar" class={`w-full h-full object-cover`} />;
  } else {
    content = (
      <div class="w-full h-full flex items-center justify-center">
        <span>?</span>
      </div>
    );
  }

  const finalClasses = [
    "!rounded-full",
    "p-2",
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
      skeleton={skeleton}
      className={finalClasses.filter(Boolean).join(" ")}
      {...restProps}
    >
      {content as any}
    </Container>
  );
}
