import type { TimelineItemProps } from "./index.tsx";
import Container from "../Container/index.tsx";
import Icon from "../Icon.tsx";

export default async function TimelineItem({
  children,
  start,
  end,
  icon,
  color = "primary",
  variant = "solid",
  className,
}: TimelineItemProps) {
  // 处理图标内容
  let iconContent = null;
  if (icon) {
    if (typeof icon === "string") {
      iconContent = await Icon({ id: icon, className: "h-5 w-5" });
    } else {
      iconContent = icon;
    }
  }

  return (
    <li class={`flex flex-col items-center flex-1 ${className || ""}`}>
      <div class="flex items-center w-full">
        {/* 左侧内容 */}
        {start && (
          <div class="flex-1 text-right pr-4">
            {start}
          </div>
        )}
        
        {/* 中间图标 */}
        <Container
          variant={variant}
          color={color}
          width="1.5rem"
          height="1.5rem"
          align="center"
          justify="center"
          rounded="full"
          className="shrink-0"
        >
          {iconContent || (
            <div class="w-2 h-2 rounded-full bg-current"></div>
          )}
        </Container>
        
        {/* 右侧内容 */}
        <div class="flex-1 pl-4">
          {end || children}
        </div>
      </div>
    </li>
  );
}