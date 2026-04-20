import type { AvatarProps } from "./index.tsx";
import Icon from "../Icon/index.tsx";
import Image from "../Image/index.tsx";

export default async function CrystalAvatar({ icon, image, src, svg, color = "primary", size = "md", className, context }: AvatarProps) {
  // 定義大小類別，與 Button/crystal.tsx 類似
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
    "2xl": "w-24 h-24",
    "3xl": "w-32 h-32",
  };

  const finalSize = sizeClasses[size] || sizeClasses["md"];

  // 定義漸層類別，基於 color，模仿 crystal 按鈕
  const colorClasses = `bg-gradient-to-t from-${color} via-${color}-50 to-${color} text-${color}-content`;

  const finalClasses = [
    "rounded-full overflow-hidden flex items-center justify-center",
    finalSize,
    colorClasses,
    "p-2",
    className
  ].join(" ");

  let content: unknown = null;

  // 渲染內容：優先使用 svg、image、src 或 icon
    if (svg) {
      content = await Icon({ svg, size, className: "w-full h-full", context });
    } else if (icon) {
      content = await Icon({ id: icon, size, className: "w-full h-full", context });
    } else if (image) {
      content = await Image({ id: image, width: "100%", height: "100%", className: "w-full h-full", context });
    } else if (src) {
      content = <img src={src} alt="Avatar" className="w-full h-full object-cover" />;
    } else {
      content = (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <span className="text-gray-500">?</span>
        </div>
      );
    }
  

  return (
    <div class={finalClasses} style={{ position: 'relative', overflow: 'hidden' }}>
      <div class="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-gray-100/80 to-gray-100/0"></div>
      <span class="relative z-10 w-full h-full flex items-center justify-center">{content}</span>
    </div>
  );
}
