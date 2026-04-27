import type { TimelineItemProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Icon from "../Icon.tsx";

export default async function TimelineItem({
  icon,
  src,
  svg,
  color = "primary",
  variant = "solid",
  className,
  context,
  skeleton,
  children, 
  start,
  end,
}: TimelineItemProps) {
  // 处理图标内容 - 支持 id/src/svg 三种方式
  let iconContent = null;
  if (svg) {
    // 直接使用 SVG 字符串
    iconContent = <span dangerouslySetInnerHTML={{ __html: svg }} class="h-3 w-3 flex items-center justify-center" />;
  } else if (src) {
    // 使用图片路径
    iconContent = <img src={src} class="h-3 w-3" alt="" />;
  } else if (icon) {
    // 使用 Icon 组件（数据库 ID）
    iconContent = await Icon({ id: icon, className: "h-3 w-3" });
  }

  return (
    <div class={`${className || ""}`}>
      {/* 只显示图标，内容由Timeline组件根据布局类型显示 */}
      <Container
        variant={variant}
        color={color}
        width="1.5rem"
        height="1.5rem"
        padding="none"
        align="center"
        justify="center"
        rounded="sm"
        context={context}
        skeleton={skeleton}
        className="shrink-0"
      >
        {iconContent || (
          <div class="w-full h-full rounded-sm"></div>
        )}
      </Container>
    </div>
  );
}