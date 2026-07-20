// Container/outline.tsx - 線框家族(Outline)高階工廠元件：反差語意完全體
import { 準備Container基底, ContainerProps } from "./index.tsx";
import {
  color2TextColor,
  adjustColorLightOrOpacity,
  CONTAINER_STORE_INIT,
  containerClassBind,
  過濾無效Props,
} from "../classes.ts";

export function createOutlineContainer(borderStyle: "solid" | "dashed" | "dotted" | "double") {
  
  return function OutlineContainer(props: ContainerProps) {
    // 1. 呼叫大腦，取得純結構類名與 inline style (大腦已無 text-base 污染)
    const { inlineStyles, baseClassesStr } = 準備Container基底(props);

    // 2. 提取專屬狀態控制項 (小寫安全防禦)
    const { color: rawColor = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;
    const color = rawColor.toLowerCase(); 

    // 3. 根據 borderStyle 計算邊框粗細度
    const borderWidth = borderStyle === "double" ? "border-4" : "border-2";

    // 4. 核心色彩與邊框矩陣運算
    // ---------------------------------------------------------
    // 4a. 【激活狀態(Active)】：原色線框 + 原色文字
    // ---------------------------------------------------------
    const activeBorder = `${borderWidth} border-${borderStyle} border-${color}`;
    const activeText = `text-${color}`;
    
    // 💡 Hover 激活：背景亮起 20 階淡色，文字轉換為 content 色
    const activeHoverClasses = hover 
      ? `hover:bg-${adjustColorLightOrOpacity(color, 20, 0)} hover:${color2TextColor(color)}` 
      : "";
    const activeFinalClasses = `bg-transparent ${activeBorder} ${activeText} ${activeHoverClasses}`.trim();

    // ---------------------------------------------------------
    // 4b. 【未激活狀態(Inactive)】：base-70 線框 + 低調過渡文字色
    // ---------------------------------------------------------
    const inactiveBorder = `${borderWidth} border-${borderStyle} border-base-70`;
    const inactiveText = `text-base-70-content`;
    
    // 💡 Hover 未激活：背景亮起 base-70，邊框收縮加深至 base-50，文字亮起成 base-content
    const inactiveHoverClasses = hover 
      ? `hover:bg-base-70 hover:border-base-50 hover:text-base-content` 
      : "";
    const inactiveFinalClasses = `bg-transparent ${inactiveBorder} ${inactiveText} ${inactiveHoverClasses}`.trim();

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
  };
}

export default createOutlineContainer("solid");