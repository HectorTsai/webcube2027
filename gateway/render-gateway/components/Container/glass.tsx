// Container/glass.tsx - 毛玻璃貨櫃（Inactive 燻黑玻璃完全體）
import { 準備Container基底, ContainerProps } from "./index.tsx";
import {
  parseColor,
  color2TextColor,
  adjustColorLightOrOpacity,
  色票CSS變數名稱,
  色票色相,
  CONTAINER_STORE_INIT,
  過濾無效Props,
} from "../classes.ts";

export default function GlassContainer(props: ContainerProps) {
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);
  const { color = "base-70", active = true, activeStateName, hover = false, children, ...rest } = props;

  const parsed = parseColor(color);
  const transitionClass = hover ? "transition-all duration-300 ease-out" : "";
  const opacityAlpha = parsed.opacity !== undefined ? parsed.opacity / 100 : 0.4;
  const hue = 色票色相(color);
  const mainVar = 色票CSS變數名稱(hue);
  const bandVar = 色票CSS變數名稱(adjustColorLightOrOpacity(hue, 20, 0));

  const activeText = color2TextColor(color);
  const activeShadow = hover ? `hover:shadow-md hover:shadow-${parsed.base}/20` : "";
  const actTextGlow = `0 0 2px oklch(var(--color-${mainVar}) / 0.6), 0 0 8px oklch(var(--color-${mainVar}) / 0.3)`;

  const actStyle = {
    ...inlineStyles,
    "background-color": `oklch(var(--color-${mainVar}) / ${opacityAlpha})`,
    "backdrop-filter": "blur(12px)",
    "-webkit-backdrop-filter": "blur(12px)",
    border: `1px solid oklch(var(--color-${bandVar}) / 0.22)`,
    "text-shadow": actTextGlow,
  };

  const actHoverStyle = hover ? {
    ...actStyle,
    "background-color": `oklch(var(--color-${mainVar}) / ${Math.min(1, opacityAlpha + 0.15)})`,
    border: `1px solid oklch(var(--color-${bandVar}) / 0.35)`,
    "text-shadow": `0 0 4px oklch(var(--color-${mainVar}) / 0.9), 0 0 14px oklch(var(--color-${mainVar}) / 0.5)`,
  } : actStyle;

  const inactiveText = "text-white";
  const inactStyle = {
    ...inlineStyles,
    "background-color": "oklch(0 0 0 / 0.45)",
    "backdrop-filter": "blur(12px)",
    "-webkit-backdrop-filter": "blur(12px)",
    border: "1px solid oklch(1 0 0 / 0.15)",
    "text-shadow": "0 0 2px oklch(1 0 0 / 0.2)",
  };

  const inactHoverStyle = hover ? {
    ...inactStyle,
    "background-color": "oklch(0 0 0 / 0.6)",
    border: "1px solid oklch(1 0 0 / 0.3)",
    "text-shadow": "0 0 4px oklch(1 0 0 / 0.5)",
  } : inactStyle;

  const hoverMouse = hover
    ? { "x-on:mouseenter": "envHover = true", "x-on:mouseleave": "envHover = false" } as const
    : {};

  const shellProps = {
    "x-data": hover ? "{ envHover: false }" : undefined,
    ...hoverMouse,
    class: `${baseClassesStr} ${transitionClass}`.trim(),
    ...過濾無效Props(rest),
  };

  if (activeStateName) {
    return (
      <div
        {...shellProps}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        x-bind:class={`$store.Container.${activeStateName} ? '${activeText} ${activeShadow}' : '${inactiveText}'`}
        x-bind:style={hover
          ? `$store.Container.${activeStateName} ? (envHover ? ${JSON.stringify(actHoverStyle)} : ${JSON.stringify(actStyle)}) : (envHover ? ${JSON.stringify(inactHoverStyle)} : ${JSON.stringify(inactStyle)})`
          : `$store.Container.${activeStateName} ? ${JSON.stringify(actStyle)} : ${JSON.stringify(inactStyle)}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      {...shellProps}
      class={`${baseClassesStr} ${active ? activeText : inactiveText} ${active && hover ? activeShadow : ""} ${transitionClass}`}
      style={active ? actStyle : inactStyle}
      {...(hover && {
        "x-bind:style": `envHover ? ${JSON.stringify(active ? actHoverStyle : inactHoverStyle)} : ${JSON.stringify(active ? actStyle : inactStyle)}`,
      })}
    >
      {children}
    </div>
  );
}
