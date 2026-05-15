import type { HeroProps } from "./index.tsx";
import Image from "../Image.tsx";
import Container from "../Container/index.tsx";

export default async function Hero({
  variant = "solid",
  color = "primary",
  direction = "column",
  align = "center",
  justify = "center",
  gap = "md",
  backgroundImage,
  backgroundSrc,
  backgroundSvg,
  fullScreen = false,
  minHeight = "24rem",
  children,
  className,
  context,
  ...restProps
}: HeroProps) {  
  // 生成背景圖像組件
  let backgroundImg: unknown;
  if (backgroundImage) backgroundImg = await Image({ id: backgroundImage, className: "absolute inset-0 w-full h-full object-cover", width: "full" });
  else if (backgroundSrc) backgroundImg = await Image({ src: backgroundSrc, className: "absolute inset-0 w-full h-full object-cover", width: "full" });
  else if (backgroundSvg) backgroundImg = await Image({ svg: backgroundSvg, className: "absolute inset-0 w-full h-full object-cover", width: "full" });

  // 設置容器的最小高度
  const containerClasses = [
    className,
    fullScreen ? "min-h-screen" : "",
    backgroundImg ? "relative" : ""
  ].filter(Boolean).join(" ");

  // 設置內容區域的佈局
  const contentClasses = [
    "flex flex-col",
    direction === "row" ? "lg:flex-row items-center" : "items-center text-center",
    gap === "none" ? "gap-0" :
    gap === "xs" ? "gap-2" :
    gap === "sm" ? "gap-4" :
    gap === "md" ? "gap-6" :
    gap === "lg" ? "gap-8" : "gap-12"
  ].filter(Boolean).join(" ");

  return (
    <Container 
      variant={variant} 
      color={color}
      direction="column"
      width="full"
      height="auto"
      padding={fullScreen ? "xl" : "lg"}
      margin="none"
      align="center"
      justify="center"
      gap="none"
      rounded="none"
      shadow="none"
      context={context}
      className={containerClasses}
      style={minHeight && !fullScreen ? { minHeight } : undefined}
      {...restProps}
    >
      {/* 背景圖像 */}
      {backgroundImg && (
        <div class="absolute inset-0 z-0 overflow-hidden">
          {backgroundImg}
          <div class="absolute inset-0 bg-black/30"></div>
        </div>
      )}
      
      {/* 內容區域 */}
      <div class={`relative z-10 max-w-4xl mx-auto w-full ${contentClasses}`}>
        {children}
      </div>
    </Container>
  );
}