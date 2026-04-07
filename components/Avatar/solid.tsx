import { jsx } from "hono/jsx";
import type { AvatarProps from "./index.tsx";
import Icon from "../Icon/index.tsx";
import Image from "../Image/index.tsx";

export default async function SolidAvatar({
  icon,
  image,
  size = "md",
  color = "primary",
  className,
  context
}: AvatarProps) {
  const sizeClasses = {
    xs: "w-8 h-8 text-xs",
    sm: "w-10 h-10 text-sm",
    md: "w-12 h-12 text-md",
    lg: "w-16 h-16 text-lg",
    xl: "w-20 h-20 text-xl",
    "2xl": "w-24 h-24 text-2xl",
    "3xl": "w-32 h-32 text-3xl",
  };

  const finalClasses = [
    sizeClasses[size],
    `text-${color}-content`,
    `bg-${color}`,
    "rounded-avatar",
    "inline-flex",
    "items-center",
    "justify-center",
    "overflow-hidden",
    "transition-all",
    "duration-200",
  ];

  if (className) {
    finalClasses.push(className);
  }

  const classes = finalClasses.filter(Boolean).join(" ");

  // 如果有 image，使用 Image 組件
  if (image) {
    return (
      <div class={classes}>
        {typeof image === "object" ? (
          image
        ) : (
          <Image src={image} alt="Avatar" className="w-full h-full object-cover" />
        )}
      </div>
    );
  }

  // 如果有 icon，使用 Icon 組件
  if (icon) {
    return (
      <div class={classes}>
        {typeof icon === "object" ? (
          icon
        ) : (
          <Icon id={icon} size={size} context={context} />
        )}
      </div>
    );
  }

  // Fallback: 使用預設的 user icon
  return (
    <div class={classes}>
      <Icon id="圖示:圖示:user" size={size} context={context} />
    </div>
  );
}
