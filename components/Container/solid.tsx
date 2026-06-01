// Container/solid.tsx - 實心(Solid)變體元件：原色接近度語意完全體
import { 準備Container基底, ContainerProps } from "./index.tsx";
import {
  parseColor,
  color2TextColor,
  adjustColorLightOrOpacity,
  CONTAINER_STORE_INIT,
  containerClassBind,
  過濾無效Props,
} from "../classes.ts";

export default function SolidContainer(props: ContainerProps) {
  // 1. 呼叫大腦，取得純結構類名與 inline style
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);

  // 2. 提取專屬狀態控制項
  const { color = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;

  // 3. 核心色彩矩陣運算 (利用原色接近度語意調製)
  const parsed = parseColor(color);

  // ---------------------------------------------------------
  // 3a. 【激活狀態(Active)】：以傳入色(如 primary)為主題焦點
  // ---------------------------------------------------------
  const activeBg = `bg-${color}`;
  const activeText = color2TextColor(color); // 自動剝離透明度，100% 顯色
  
  // 💡 Hover 激活：讓激活的原色向外偏離 20 個階層步進進行明暗反饋
  const activeHoverBg = hover 
    ? `hover:bg-${adjustColorLightOrOpacity(color, 20, 0)}` 
    : "";

  // ---------------------------------------------------------
  // 3b. 【未激活狀態(Inactive)】：走最完美的過渡層次 base-70
  // ---------------------------------------------------------
  // 完美保留使用者可能設定的透明度（如 color="primary/40"，未激活就走 "base-70/40"）
  const inactiveBgRaw = parsed.opacity ? `base-70/${parsed.opacity}` : "base-70";
  const inactiveBg = `bg-${inactiveBgRaw}`;
  const inactiveText = color2TextColor(inactiveBgRaw);

  // 💡 Hover 未激活：懸停在 base-70 上時，向反差方向挪動，變成更明顯、更凝聚視覺的 base-50
  const inactiveHoverBgRaw = parsed.opacity ? `base-50/${parsed.opacity}` : "base-50";
  const inactiveHoverBg = hover 
    ? `hover:bg-${inactiveHoverBgRaw}` 
    : "";

  // ---------------------------------------------------------
  // 4. 組合最終的色彩類名鏈
  // ---------------------------------------------------------
  const activeFinalClasses = `${activeBg} ${activeText} ${activeHoverBg}`.trim();
  const inactiveFinalClasses = `${inactiveBg} ${inactiveText} ${inactiveHoverBg}`.trim();

  // 5. 根據是否具備 Alpine.js 狀態指針，分流渲染邏輯
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
