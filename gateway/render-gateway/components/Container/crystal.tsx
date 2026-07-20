// Container/crystal.tsx - 水晶玻璃容器 (AI 友善、Inactive 微光邊框防禦完全體)
import type { ContainerProps } from "./index.tsx";
import { 準備Container基底 } from "./index.tsx"; // 💡 新架構核心：全面接管尺寸、結構類名與 inline style
import { parseColor, CONTAINER_STORE_INIT, 過濾無效Props } from "../classes.ts";
import { processChildren } from "../index.ts";

export default function CrystalContainer(props: ContainerProps) {
  // 1. 呼叫基礎大腦，取得結構類名與基礎 inline style (處理寬高、Padding、Margin、圓角、陰影、Flex 方向)
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);

  // 2. 提取屬性與狀態
  const { color = "primary", active = true, activeStateName, hover = false, children, variant, context, ...rest } = props;

  // 3. 處理 children，自動傳遞 color/variant/context
  const processedChildren = processChildren(children, { color, variant, context });

  // ---------------------------------------------------------
  // 4. AI 友善防禦與微光邊框矩陣
  // ---------------------------------------------------------
  const parsedColor = parseColor(color);
  const actBg = parsedColor.base; // 強行只取 base 名稱，如 primary
  const inactBg = "base";          // 對齊系統最穩固的水晶中性字串

  // 🟢 激活狀態樣式：維持無邊框的純粹水晶感 (`border-0`)
  const activeFull = `border-0 bg-crystal-${actBg} ${hover ? `hover:bg-crystal-hover-${actBg}` : ""} text-${color}-30-content`;
  
  // 🎯 未激活狀態樣式：神來之筆！加上 border-base-70，徹底拯救消融現象，拉出高級精緻輪廓線！
  const inactiveFull = `border border-solid border-base-70/30 bg-crystal-${inactBg} ${hover ? `hover:bg-crystal-hover-${inactBg}` : ""} text-base-30-content`;

  const hoverClasses = hover ? "transition-all duration-300" : "";

  // ---------------------------------------------------------
  // 5A. 純靜態渲染模式 (沒有 Alpine.js 動態狀態時)
  // ---------------------------------------------------------
  if (!activeStateName) {
    const bgAndTextClasses = active ? activeFull : inactiveFull;

    return (
      <div
        class={`${baseClassesStr} ${bgAndTextClasses} ${hoverClasses}`.trim()}
        style={inlineStyles}
        {...過濾無效Props(rest)}
      >
        {processedChildren}
      </div>
    );
  }

  // ---------------------------------------------------------
  // 5B. Alpine.js 動態狀態模式 (完美動態切換：Active(無邊框) 🔁 Inactive(精緻邊框))
  // ---------------------------------------------------------
  return (
    <div
      class={`${baseClassesStr} ${hoverClasses}`.trim()}
      style={inlineStyles}
      x-init={CONTAINER_STORE_INIT(activeStateName, active)}
      x-bind:class={`$store.Container.${activeStateName} ? '${activeFull}' : '${inactiveFull}'`}
      {...過濾無效Props(rest)}
    >
      {processedChildren}
    </div>
  );
}
