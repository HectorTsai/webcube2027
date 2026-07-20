// Container/gradient.tsx - 漸層家族終極高階工廠 (回歸最純粹、全狀態透明度完美支援版)
import { 準備Container基底, ContainerProps } from "./index.tsx";
// 💡 精準調用全域字典庫
import {
  parseColor,
  adjustColorLightOrOpacity,
  CONTAINER_STORE_INIT,
  containerClassBind,
  過濾無效Props,
} from "../classes.ts";

export type GradientType = "right" | "left" | "up" | "down" | "diagonal" | "center" | "middle" | "cone";

export function createGradientContainer(type: GradientType) {
  return function GradientContainer(props: ContainerProps) {
    // 1. 呼叫基礎大腦，取得結構類名與基礎 inline style
    const { inlineStyles, baseClassesStr } = 準備Container基底(props);

    // 2. 提取狀態
    const { color = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;

    // 🎯 漸層方向與模式映射
    let directionClass = "";
    switch (type) {
      case "right":    directionClass = "bg-gradient-to-r"; break;
      case "left":     directionClass = "bg-gradient-to-l"; break;
      case "up":       directionClass = "bg-gradient-to-t"; break;
      case "down":     directionClass = "bg-gradient-to-b"; break;
      case "diagonal": directionClass = "bg-gradient-to-br"; break;
      case "middle":   directionClass = "bg-gradient-to-r"; break; // 從左到右三色包夾
      case "center":   directionClass = "bg-gradient-to-b"; break; // 從上到下三色包夾
      case "cone":     directionClass = "bg-conic"; break;
    }

    // ---------------------------------------------------------
    // 3. 刻度精準分配：100% 傳入最原本、最豐富的帶透明度色彩軌道
    // ---------------------------------------------------------
    // 💡 激活狀態 (Active):
    const actFrom = color;                                    // 原始色 (預設 100)
    const actVia  = adjustColorLightOrOpacity(color, 30, 0);  // 100 - 50 = 50 (精準命中 50 刻度)
    const actTo   = adjustColorLightOrOpacity(color, 50, 0);  // 100 - 70 = 30 (精準命中 30 刻度)
    const actHvr  = adjustColorLightOrOpacity(color, 70, 0);  // 100 - 90 = 10 (🎯 Hover 爆發色，精準命中 10 刻度)

    // 💡 未激活狀態 (Inactive): 老老實實產生 base-30/70 這種高階半透明色
    const inactFrom = adjustColorLightOrOpacity("base", 30, 70); // 100 - 10 = 90
    const inactVia  = adjustColorLightOrOpacity("base", 30, 30);  // 100 - 50 = 50
    const inactTo   = adjustColorLightOrOpacity("base", 50, 30);  // 100 - 70 = 30
    const inactHvr  = adjustColorLightOrOpacity("base", 50, 0);  // 100 - 90 = 10

    const isCone = type === "cone";

    // ---------------------------------------------------------
    // 4A. 純靜態渲染模式 (沒有 Alpine.js 動態狀態時)
    // ---------------------------------------------------------
    if (!activeStateName) {
      let bgClass = "";
      const textClass = active ? `text-${color}-content` : `text-base-70-content`;
      
      const from = active ? actFrom : inactFrom;
      const via  = active ? actVia  : inactVia;
      const to   = active ? actTo   : inactTo;
      const hvr  = active ? actHvr  : inactHvr;

      if (isCone) {
        // 🎯 乾淨純粹的格式，不管是 active 還是帶斜線的 inactive，此處拼接都完全一致！
        bgClass = hover 
          ? `${directionClass}-[${from},${to}] hover:${directionClass}-[${from},${hvr}]`
          : `${directionClass}-[${from},${to}]`;
      } 
      else if (type === "middle" || type === "center") {
        bgClass = hover
          ? `${directionClass} from-${to} via-${from} to-${to} hover:from-${hvr} hover:via-${from} hover:to-${hvr}`
          : `${directionClass} from-${to} via-${from} to-${to}`;
      } 
      else {
        bgClass = hover
          ? `${directionClass} from-${from} to-${to} hover:to-${hvr}`
          : `${directionClass} from-${from} to-${to}`;
      }

      const hoverClasses = hover ? "transition-all duration-300" : "";

      return (
        <div
          class={`${baseClassesStr} border-0 ${bgClass} ${textClass} ${hoverClasses}`.trim()}
          style={inlineStyles}
          {...過濾無效Props(rest)}
        >
          {children}
        </div>
      );
    }

    // ---------------------------------------------------------
    // 4B. Alpine.js 動態狀態模式
    // ---------------------------------------------------------
    const activeText = `text-${color}-content`;
    const inactiveText = `text-base-70-content`;
    
    let activeBgSet = "";
    let inactiveBgSet = "";

    if (isCone) {
      // 🎯 動態模式下，inactive 直接吃包含透明度的字串組合，底層 UnoCSS 生成器此時正快樂地完成編譯！
      activeBgSet = `${directionClass}-[${actFrom},${actTo}] ${hover ? `hover:${directionClass}-[${actFrom},${actHvr}]` : ""}`;
      inactiveBgSet = `${directionClass}-[${inactFrom},${inactTo}] ${hover ? `hover:${directionClass}-[${inactFrom},${inactHvr}]` : ""}`;
    } 
    else if (type === "middle" || type === "center") {
      activeBgSet = `${directionClass} from-${actFrom} via-${actVia} to-${actFrom} ${hover ? `hover:via-${actHvr} hover:to-${actVia}` : ""}`;
      inactiveBgSet = `${directionClass} from-${inactFrom} via-${inactVia} to-${inactFrom} ${hover ? `hover:via-${inactHvr} hover:to-${inactVia}` : ""}`;
    } 
    else {
      activeBgSet = `${directionClass} from-${actFrom} to-${actTo} ${hover ? `hover:to-${actHvr}` : ""}`;
      inactiveBgSet = `${directionClass} from-${inactFrom} to-${inactTo} ${hover ? `hover:to-${inactHvr}` : ""}`;
    }

    const hoverClasses = hover ? "transition-all duration-300" : "";
    const activeFull = `border-0 ${activeBgSet} ${activeText} ${hoverClasses}`.trim();
    const inactiveFull = `border-0 ${inactiveBgSet} ${inactiveText} ${hoverClasses}`.trim();

    return (
      <div
        class={baseClassesStr}
        style={inlineStyles}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        x-bind:class={containerClassBind(activeStateName, activeFull, inactiveFull)}
        {...過濾無效Props(rest)}
      >
        {children}
      </div>
    );
  };
}