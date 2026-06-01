// Container/cyber-clip.tsx - 科技晶片切角（clip-path + inline oklch 填色）
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

const INACTIVE_SURFACE = "base-70";
const INACTIVE_HOVER_SURFACE = "base-50";
const CLIP_GEOMETRY = {
  "clip-path": "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)",
  "-webkit-clip-path": "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)",
} as const;

type 樣式組 = { normal: Record<string, string>; hover: Record<string, string> };

function 裁切填色樣式(inline: Record<string, string>, 色票: string): Record<string, string> {
  const { opacity } = parseColor(色票);
  const alpha = opacity !== undefined ? opacity / 100 : 1;
  return {
    ...inline,
    ...CLIP_GEOMETRY,
    "background-color": `oklch(var(--color-${色票CSS變數名稱(色票色相(色票))}) / ${alpha})`,
  };
}

function 建立裁切樣式組(
  inline: Record<string, string>,
  色票: string,
  hover色票: string,
): 樣式組 {
  return {
    normal: 裁切填色樣式(inline, 色票),
    hover: 裁切填色樣式(inline, hover色票),
  };
}

function 建立樣式Hover綁定(
  active: 樣式組,
  inactive: 樣式組,
  opts: { storeKey?: string; isActive?: boolean },
): string {
  const aN = JSON.stringify(active.normal);
  const aH = JSON.stringify(active.hover);
  const iN = JSON.stringify(inactive.normal);
  const iH = JSON.stringify(inactive.hover);

  if (opts.storeKey) {
    const s = `$store.Container.${opts.storeKey}`;
    return `${s} ? (envHover ? ${aH} : ${aN}) : (envHover ? ${iH} : ${iN})`;
  }
  const on = opts.isActive ?? false;
  return `envHover ? (${on ? aH : iH}) : (${on ? aN : iN})`;
}

function 建立類名Hover綁定(
  組合表面: (文字: string) => string,
  active: { normal: string; hover: string },
  inactive: { normal: string; hover: string },
  opts: { storeKey?: string; isActive?: boolean; hover: boolean },
): string {
  if (opts.storeKey) {
    const s = `$store.Container.${opts.storeKey}`;
    if (!opts.hover) {
      return `${s} ? '${組合表面(active.normal)}' : '${組合表面(inactive.normal)}'`;
    }
    return `${s} ? (envHover ? '${組合表面(active.hover)}' : '${組合表面(active.normal)}') : (envHover ? '${組合表面(inactive.hover)}' : '${組合表面(inactive.normal)}')`;
  }
  if (!opts.hover) {
    return 組合表面(opts.isActive ? active.normal : inactive.normal);
  }
  return `envHover ? '${組合表面(opts.isActive ? active.hover : inactive.hover)}' : '${組合表面(opts.isActive ? active.normal : inactive.normal)}'`;
}

export default function CyberClipContainer(props: ContainerProps) {
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);
  const { color: rawColor = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;
  const color = rawColor.toLowerCase();

  const activeHoverFill = adjustColorLightOrOpacity(color, 20, 0);
  const activeStyles = 建立裁切樣式組(inlineStyles, color, activeHoverFill);
  const inactiveStyles = 建立裁切樣式組(inlineStyles, INACTIVE_SURFACE, INACTIVE_HOVER_SURFACE);

  const text = {
    active: { normal: color2TextColor(color), hover: color2TextColor(activeHoverFill) },
    inactive: { normal: color2TextColor(INACTIVE_SURFACE), hover: color2TextColor(INACTIVE_HOVER_SURFACE) },
  };

  const transitionClass = hover ? "transition-all duration-300 ease-out" : "";
  const 組合表面 = (文字類名: string) => `${baseClassesStr} ${文字類名} ${transitionClass}`.trim();

  const hoverMouse = hover
    ? { "x-on:mouseenter": "envHover = true", "x-on:mouseleave": "envHover = false" } as const
    : {};

  const shellProps = {
    "x-data": hover ? "{ envHover: false }" : undefined,
    ...hoverMouse,
    ...過濾無效Props(rest),
  };

  const classBindOpts = { storeKey: activeStateName, isActive: active, hover };

  if (activeStateName) {
    return (
      <div
        {...shellProps}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        x-bind:class={建立類名Hover綁定(組合表面, text.active, text.inactive, classBindOpts)}
        x-bind:style={hover
          ? 建立樣式Hover綁定(activeStyles, inactiveStyles, { storeKey: activeStateName })
          : `$store.Container.${activeStateName} ? ${JSON.stringify(activeStyles.normal)} : ${JSON.stringify(inactiveStyles.normal)}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      {...shellProps}
      {...(hover
        ? {
          "x-bind:class": 建立類名Hover綁定(組合表面, text.active, text.inactive, { isActive: active, hover: true }),
          "x-bind:style": 建立樣式Hover綁定(activeStyles, inactiveStyles, { isActive: active }),
        }
        : {
          class: 建立類名Hover綁定(組合表面, text.active, text.inactive, { isActive: active, hover: false }),
          style: active ? activeStyles.normal : inactiveStyles.normal,
        })}
    >
      {children}
    </div>
  );
}

