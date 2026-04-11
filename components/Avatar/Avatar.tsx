import type { AvatarProps } from "./index.tsx";
import Icon from "../Icon.tsx";
import Image from "../Image.tsx";
import Container from "../Container/index.tsx";

const sizeDimensions: Record<string, string> = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
  "2xl": "w-24 h-24",
  "3xl": "w-32 h-32",
};

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
  const sizeDimension = sizeDimensions[size] || sizeDimensions.md;

  let content: unknown = null;

  if (svg) {
    content = await Icon({ svg, size, className: `w-full h-full`, context });
  } else if (icon) {
    content = await Icon({ id: icon, size, className: `w-full h-full`, context });
  } else if (image) {
    content = await Image({ id: image, width: "100%", height: "100%", className: `w-full h-full`, context });
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
    sizeDimension,
    "!rounded-full",
    "p-2",
    className
  ];

  return (
    <Container
      direction="column"
      color={color}
      variant={variant}
      width="full"
      padding="none"
      margin="none"
      align="center"
      justify="center"
      gap="none"
      className={finalClasses.filter(Boolean).join(" ")}
      {...restProps}
    >
      {content as any}
    </Container>
  );
}
