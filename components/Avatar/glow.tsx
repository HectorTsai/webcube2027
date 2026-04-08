import type { AvatarProps } from "./index.tsx";
import Icon from "../Icon/index.tsx";
import Image from "../Image/index.tsx";

// Size classes mapping
const sizeClasses: Record<string, string> = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
  "2xl": "w-24 h-24",
  "3xl": "w-32 h-32",
};

export default async function GlowAvatar({
  icon,
  image,
  src,
  svg,
  size = "md",
  color = "primary",
  className = "",
  context
}: AvatarProps) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  let content: unknown = null;
  
  if (svg) {
    content = await Icon({ svg, size, className: `w-full h-full text-${color}-content` });
  } else if (icon) {
    content = await Icon({ id: icon, size, className: `w-full h-full text-${color}-content`, context });
  } else if (image) {
    content = await Image({ id: image, width: "100%", height: "100%", className:`w-full h-full text-${color}-content`, context });
  } else if (src) {
    content = <img src={src} alt="Avatar" className="w-full h-full object-cover" />;
  } else {
    content = (
      <div className="w-full h-full flex items-center justify-center bg-gray-200">
        <span className="text-gray-500">?</span>
      </div>
    );
  }
  
  const finalClasses = [
    "avatar",
    sizeClass,
    `bg-${color} text-${color}-content`,
    "rounded-avatar",
    "flex items-center justify-center",
    "overflow-hidden",
    "border-0",
    "p-2",
    `shadow-${color}-50/50`,
    "shadow-lg",
    "hover:shadow-xl",
    className
  ];
  
  const classes = finalClasses.filter(Boolean).join(" ");
  
  return (
    <div class={classes}>
      {content as any}
    </div>
  );
}
