import type { CardProps } from "./index.tsx";
import Image from "../Image.tsx";
import Container from "../Container/index.tsx";

export default async function Card({
  variant = "solid",
  color = "primary",
  direction = "column",
  align = "stretch",
  justify = "start",
  gap = "none",
  image,
  src,
  children,
  className,
  context,
  ...restProps
}: CardProps) {  
  // 根据 direction 设置图像布局
  const imageClasses = direction === "column" 
    ? "w-full h-32 rounded-t-md" // 垂直布局：图像在上方
    : "w-48 rounded-l-md flex-shrink-0"; // 水平布局：图像在左侧，高度由 Alpine.js 控制

    // 生成图像组件
  let img: unknown;
  if (image) img = await Image({ id: image, objectFit:"cover",className: imageClasses, width:"100%", height: direction === "row" ? "100%" : "auto" });
  else if (src) img = await Image({ src: src, objectFit:"cover", className: imageClasses, width:"100%", height: direction === "row" ? "100%" : "auto" });

  // 设置容器的最小高度，确保水平布局时有足够的高度
  const containerClasses = [
    className,
    direction === "row" ? "flex flex-row" : ""
  ].filter(Boolean).join(" ");

  return (
    <Container 
      variant={variant} 
      color={color}
      direction={direction}
      width="auto"
      height="auto"
      padding="none"
      margin="none"
      align={align}
      justify={justify}
      gap={gap}
      rounded="md"
      shadow="md"
      context={context}
      className={containerClasses}
      data-direction={direction}
      {...restProps}
    >
      {img && (
        <div class="basis-1/3">
          {img}
        </div>
      )}
      <div class="p-4 flex-1 w-full min-w-0 flex flex-col box-border">
        {children}
      </div>
    </Container>
  );
}
