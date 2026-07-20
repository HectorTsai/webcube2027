// Container/ghost.tsx - 幽靈(Ghost)變體元件：原色接近度語意完全體
import { 準備Container基底, ContainerProps } from "./index.tsx";
import {
  color2TextColor,
  adjustColorLightOrOpacity,
  CONTAINER_STORE_INIT,
  containerClassBind,
  過濾無效Props,
} from "../classes.ts";

export default function GhostContainer(props: ContainerProps) {
  // 1. 呼叫大腦，取得純結構類名與 inline style
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);

  // 2. 提取專屬狀態控制項
  const { color = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;

  // 3. 核心色彩矩陣運算 (利用 Ghost 的透明對稱語意)
  // ---------------------------------------------------------
  // 3a. 【激活狀態(Active)】：背景透明 + 原色文字
  // ---------------------------------------------------------
  const activeBg = "bg-transparent";
  const activeText = `text-${color}`;
  
  // 💡 Hover 激活：背景亮起原色偏離 20 階的淡色，文字轉為 content 清晰顯色
  const activeHoverClasses = hover 
    ? `hover:bg-${adjustColorLightOrOpacity(color, 20, 0)} hover:${color2TextColor(color)}` 
    : "";
  const activeFinalClasses = `${activeBg} ${activeText} ${activeHoverClasses}`.trim();

  // ---------------------------------------------------------
  // 3b. 【未激活狀態(Inactive)】：背景透明 + 低調過渡文字色
  // ---------------------------------------------------------
  const inactiveBg = "bg-transparent";
  const inactiveText = `text-base-70-content`; // 走與背景高度融洽的文字指針
  
  // 💡 Hover 未激活：背景亮起過渡層次 base-70，文字轉為 100% 飽和的 base 文字正色
  const inactiveHoverClasses = hover 
    ? `hover:bg-base-70 hover:text-base-content` 
    : "";
  const inactiveFinalClasses = `${inactiveBg} ${inactiveText} ${inactiveHoverClasses}`.trim();

  // ---------------------------------------------------------
  // 4. 根據是否具備 Alpine.js 狀態指針，分流渲染邏輯
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
