// Container/minimalist.tsx - 極簡(Minimalist)變體元件：大腦公式一體化版
import { 準備Container基底, ContainerProps } from "./index.tsx";
import { CONTAINER_STORE_INIT, containerClassBind, 過濾無效Props } from "../classes.ts";

export default function MinimalistContainer(props: ContainerProps) {
  // 1. 呼叫大腦，取得純結構類名與 inline style (完美獲得全域尺寸矩陣能力)
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);

  // 2. 提取專屬狀態控制項 (小寫安全防禦)
  const { color: rawColor = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;
  const color = rawColor.toLowerCase();

  // 3. 基礎極簡邊框與背板結構 (不與大腦衝突)
  const minimalistBase = "border border-solid border-gray-200";

  // 4. 核心色彩與陰影矩陣運算
  // ---------------------------------------------------------
  // 4a. 【激活狀態(Active)】：極簡灰底 + 原色文字 + 原色微陰影
  // ---------------------------------------------------------
  const activeBg = "bg-gray-100";
  const activeText = `text-${color}`;
  const activeShadow = `shadow-sm shadow-${color}`;
  
  // 💡 Hover 激活：背景跨進 20 階變深
  const activeHoverClasses = hover ? "hover:bg-gray-200" : "";
  const activeFinalClasses = `${minimalistBase} ${activeBg} ${activeText} ${activeShadow} ${activeHoverClasses}`.trim();

  // ---------------------------------------------------------
  // 4b. 【未激活狀態(Inactive)】：極簡灰底 + 灰階文字 + 灰色微陰影
  // ---------------------------------------------------------
  const inactiveBg = "bg-gray-100";
  const inactiveText = "text-gray-500";
  const inactiveShadow = "shadow-sm shadow-gray-300";
  
  // 💡 Hover 未激活：背景跨進 20 階變深
  const inactiveHoverClasses = hover ? "hover:bg-gray-200" : "";
  const inactiveFinalClasses = `${minimalistBase} ${inactiveBg} ${inactiveText} ${inactiveShadow} ${inactiveHoverClasses}`.trim();

  // ---------------------------------------------------------
  // 5. 根據是否具備 Alpine.js 狀態指針，分流渲染邏輯
  // ---------------------------------------------------------
  if (activeStateName) {
    return (
      <div
        class={baseClassesStr}
        style={inlineStyles}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        x-bind:class={containerClassBind(activeStateName, activeFinalClasses, inactiveFinalClasses)}
        {...過濾無效Props(rest)}
      >
        {children}
      </div>
    );
  }

  // 純靜態渲染模式
  const finalColorClasses = active ? activeFinalClasses : inactiveFinalClasses;

  return (
    <div
      class={`${baseClassesStr} ${finalColorClasses}`}
      style={inlineStyles}
      {...過濾無效Props(rest)}
    >
      {children}
    </div>
  );
}
