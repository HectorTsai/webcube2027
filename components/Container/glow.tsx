// Container/glow.tsx - 霓虹外發光(Glow)元件：高階色彩演算法與霓虹靈魂完全體
import { 準備Container基底, ContainerProps } from "./index.tsx";
// 💡 精準導航至全域色彩大腦
import {
  parseColor,
  color2TextColor,
  adjustColorLightOrOpacity,
  CONTAINER_STORE_INIT,
  containerClassBind,
  過濾無效Props,
} from "../classes.ts";

export default function GlowContainer(props: ContainerProps) {
  // 1. 呼叫骨架大腦，取得純結構類名與 inline style（圓角 rounded、寬高、幾何間距全面解放）
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);

  // 2. 提取狀態控制（🎯 100% 依循原版預設值：active 預設為 true！）
  const { color = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;

  const parsed = parseColor(color);
  const transitionClass = hover ? "transition-all duration-200" : "";
  const scaleClass = hover ? "hover:scale-105" : ""; // 🎯 滿血還原原版 scale-105 放大反饋

  // ---------------------------------------------------------
  // 3a. 【激活狀態(Active)】：全面由色彩大腦計算
  // ---------------------------------------------------------
  const activeBg = `bg-${color}`;
  const activeText = color2TextColor(color);
  
  // 💡 精準發光：平常狀態為大發光的 shadow-lg，影子顏色精準與主色連動
  const activeGlow = `shadow-lg shadow-${color}`; 
  
  // 🎯 核心演算法：Hover 激活時背景切換至凝聚的 70 刻度軌道
  // 💡 霓虹暴漲：Hover 時發光完美增強至 shadow-xl，且影子顏色跟著背景一起變幻至凝聚色！
  const actHvrColor = adjustColorLightOrOpacity(color, 20, 0);
  const activeHoverClasses = hover
    ? `hover:bg-${actHvrColor} hover:shadow-xl hover:shadow-${actHvrColor} ${scaleClass}`
    : "";

  // ---------------------------------------------------------
  // 3b. 【未激活狀態(Inactive)】：完美呼叫 base-70 儀表板深暗調語意
  // ---------------------------------------------------------
  // 🎯 核心演算法：未激活時背景走 base-70（自動繼承使用者傳入的原始透明度）
  const inactiveBgRaw = parsed.opacity ? `base-70/${parsed.opacity}` : "base-70";
  const inactiveBg = `bg-${inactiveBgRaw}`;
  const inactiveText = color2TextColor(inactiveBgRaw);
  
  // 💡 微光發光：未激活時，發光為緊緻內斂的 shadow-lg shadow-base-70
  const inactiveGlow = `shadow-lg shadow-${inactiveBgRaw}`; 

  // 🎯 核心演算法：Hover 未激活時，背景向外挪動到更凝聚、亮灰色的 base-50 軌道
  // 💡 霓虹暴漲：Hover 未激活發光同樣增強至 shadow-xl，影子顏色同步聯動，並搭配 scale-105
  const inactHvrColor = parsed.opacity ? `base-50/${parsed.opacity}` : "base-50";
  const inactiveHoverClasses = hover
    ? `hover:bg-${inactHvrColor} hover:shadow-xl hover:shadow-${inactHvrColor} ${scaleClass}`
    : "";

  // ---------------------------------------------------------
  // 4. 組合最終的狀態類名鏈
  // ---------------------------------------------------------
  const activeFinalClasses = `${activeBg} ${activeText} ${activeGlow} ${activeHoverClasses} ${transitionClass}`.trim();
  const inactiveFinalClasses = `${inactiveBg} ${inactiveText} ${inactiveGlow} ${inactiveHoverClasses} ${transitionClass}`.trim();

  // ---------------------------------------------------------
  // 5. Alpine.js 動態狀態模式分流
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
