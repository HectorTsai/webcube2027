// Container/neon.tsx - 流光霓虹貨櫃：outline 語意 + hover 點亮四向光暈
import { 準備Container基底, ContainerProps } from "./index.tsx";
import {
  color2TextColor,
  adjustColorLightOrOpacity,
  shadowClasses,
  色票CSS變數名稱,
  CONTAINER_STORE_INIT,
  containerClassBind,
  過濾無效Props,
} from "../classes.ts";

const INACTIVE_SURFACE = "base-70";

/** 0 偏移、四向對稱三層光暈（hover 時點亮） */
function 霓虹光暈(色票變數: string): string {
  const c = `oklch(var(--color-${色票變數})`;
  return [
    `0 0 4px ${c} / 0.75)`,
    `0 0 12px ${c} / 0.45)`,
    `0 0 22px ${c} / 0.28)`,
  ].join(", ");
}

function 無光暈樣式(inline: Record<string, string>) {
  return { ...inline, boxShadow: "none" };
}

function 霓虹光暈樣式(inline: Record<string, string>, 色票: string) {
  return { ...inline, boxShadow: 霓虹光暈(色票CSS變數名稱(色票)) };
}

function 建立Hover樣式綁定(
  actJson: string,
  inactJson: string,
  actGlowJson: string,
  inactGlowJson: string,
  opts: { storeKey?: string; active?: boolean },
): string {
  if (opts.storeKey) {
    const s = `$store.Container.${opts.storeKey}`;
    return `${s} ? (envHover ? ${actGlowJson} : ${actJson}) : (envHover ? ${inactGlowJson} : ${inactJson})`;
  }
  const isActive = opts.active ?? false;
  return `envHover ? (${isActive ? actGlowJson : inactGlowJson}) : (${isActive ? actJson : inactJson})`;
}

export default function NeonContainer(props: ContainerProps) {
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);
  const { color: rawColor = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;
  const color = rawColor.toLowerCase();

  const borderWidth = "border-2";

  const activeBorder = `${borderWidth} border-solid border-${color}`;
  const activeHoverClasses = hover
    ? `hover:bg-${adjustColorLightOrOpacity(color, 20, 0)} hover:${color2TextColor(color)}`
    : "";
  const activeFinalClasses = `bg-transparent ${activeBorder} text-${color} ${shadowClasses.none} ${activeHoverClasses}`.trim();

  const inactiveBorder = `${borderWidth} border-solid border-${INACTIVE_SURFACE}`;
  const inactiveHoverClasses = hover
    ? `hover:bg-${INACTIVE_SURFACE} hover:border-base-50 hover:text-base-content`
    : "";
  const inactiveFinalClasses = `bg-transparent ${inactiveBorder} ${color2TextColor(INACTIVE_SURFACE)} ${shadowClasses.none} ${inactiveHoverClasses}`.trim();

  const actStyle = 無光暈樣式(inlineStyles);
  const inactStyle = 無光暈樣式(inlineStyles);
  const activeGlowStyle = 霓虹光暈樣式(inlineStyles, color);
  const inactiveGlowStyle = 霓虹光暈樣式(inlineStyles, INACTIVE_SURFACE);

  const actJson = JSON.stringify(actStyle);
  const inactJson = JSON.stringify(inactStyle);
  const actGlowJson = JSON.stringify(activeGlowStyle);
  const inactGlowJson = JSON.stringify(inactiveGlowStyle);

  const hoverMouse = hover
    ? { "x-on:mouseenter": "envHover = true", "x-on:mouseleave": "envHover = false" } as const
    : {};

  if (activeStateName) {
    return (
      <div
        x-data={hover ? "{ envHover: false }" : undefined}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        {...hoverMouse}
        class={baseClassesStr}
        x-bind:class={containerClassBind(activeStateName, activeFinalClasses, inactiveFinalClasses)}
        x-bind:style={hover
          ? 建立Hover樣式綁定(actJson, inactJson, actGlowJson, inactGlowJson, { storeKey: activeStateName })
          : `$store.Container.${activeStateName} ? ${actJson} : ${inactJson}`}
        {...過濾無效Props(rest)}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      x-data={hover ? "{ envHover: false }" : undefined}
      {...hoverMouse}
      class={`${baseClassesStr} ${active ? activeFinalClasses : inactiveFinalClasses}`}
      {...(hover
        ? { "x-bind:style": 建立Hover樣式綁定(actJson, inactJson, actGlowJson, inactGlowJson, { active }) }
        : { style: active ? actStyle : inactStyle })}
      {...過濾無效Props(rest)}
    >
      {children}
    </div>
  );
}

