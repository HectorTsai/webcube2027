// Container/paper.tsx - 紙張質感：color 淡色底 + 同色系 315° 斜線紋
import { 準備Container基底, ContainerProps } from "./index.tsx";
import {
  parseColor,
  color2TextColor,
  adjustColorLightOrOpacity,
  色票CSS變數名稱,
  色票色相,
  CONTAINER_STORE_INIT,
  containerClassBind,
  過濾無效Props,
} from "../classes.ts";

const INACTIVE_SURFACE = "base-90";
const TEXTURE_ANGLE = 315;
const TEXTURE_TILE = "8px 8px";
const LINE_ALPHA = { normal: 0.3, hover: 0.2 } as const;
const HOVER_SURFACE_STEP = 20;
const TEXTURE_SHADE = { normal: 70, hover: 50 } as const;

type 樣式組 = { normal: Record<string, string>; hover: Record<string, string> };

function 紙面色票(色票: string): string {
  const { base, shade, opacity } = parseColor(色票);
  const surface = shade !== undefined ? `${base}-${shade}` : `${base}-90`;
  return opacity !== undefined ? `${surface}/${opacity}` : surface;
}

function 紙張背景樣式(
  inline: Record<string, string>,
  底色色票: string,
  紋理色票: string,
  lineAlpha: number,
): Record<string, string> {
  const { opacity } = parseColor(底色色票);
  const fillAlpha = opacity !== undefined ? opacity / 100 : 1;
  const line = `oklch(var(--color-${色票CSS變數名稱(紋理色票)}) / ${lineAlpha})`;
  return {
    ...inline,
    backgroundColor: `oklch(var(--color-${色票CSS變數名稱(底色色票)}) / ${fillAlpha})`,
    backgroundImage: `repeating-linear-gradient(${TEXTURE_ANGLE}deg, ${line} 0, ${line} 1px, transparent 1px, transparent 50%)`,
    backgroundSize: TEXTURE_TILE,
  };
}

function 建立紙張樣式組(inline: Record<string, string>, 底色色票: string): 樣式組 {
  const { base } = parseColor(底色色票);
  const hover底色 = adjustColorLightOrOpacity(底色色票, HOVER_SURFACE_STEP, 0);
  return {
    normal: 紙張背景樣式(inline, 底色色票, `${base}-${TEXTURE_SHADE.normal}`, LINE_ALPHA.normal),
    hover: 紙張背景樣式(inline, hover底色, `${base}-${TEXTURE_SHADE.hover}`, LINE_ALPHA.hover),
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

function 外殼類名(border: string, text: string, hover: boolean): string {
  const motion = hover ? "transition-all duration-300 ease-out hover:shadow-md" : "";
  return `border border-solid shadow-sm ${border} ${text} ${motion}`.trim();
}

export default function PaperContainer(props: ContainerProps) {
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);
  const { color: rawColor = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;
  const color = rawColor.toLowerCase();

  const activeStyles = 建立紙張樣式組(inlineStyles, 紙面色票(color));
  const inactiveStyles = 建立紙張樣式組(inlineStyles, INACTIVE_SURFACE);

  const { base } = parseColor(色票色相(color));
  const shells = {
    active: 外殼類名(`border-${base}-70`, color2TextColor(color), hover),
    inactive: 外殼類名("border-base-70", color2TextColor("base-70"), hover),
  };

  const hoverMouse = hover
    ? { "x-on:mouseenter": "envHover = true", "x-on:mouseleave": "envHover = false" } as const
    : {};

  const shellProps = {
    "x-data": hover ? "{ envHover: false }" : undefined,
    ...hoverMouse,
    class: baseClassesStr,
    ...過濾無效Props(rest),
  };

  const styleBindOpts = { storeKey: activeStateName, isActive: active };
  const styleProps = hover
    ? { "x-bind:style": 建立樣式Hover綁定(activeStyles, inactiveStyles, styleBindOpts) }
    : activeStateName
      ? { "x-bind:style": `$store.Container.${activeStateName} ? ${JSON.stringify(activeStyles.normal)} : ${JSON.stringify(inactiveStyles.normal)}` }
      : { style: active ? activeStyles.normal : inactiveStyles.normal };

  if (activeStateName) {
    return (
      <div
        {...shellProps}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        x-bind:class={containerClassBind(activeStateName, shells.active, shells.inactive)}
        {...styleProps}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      {...shellProps}
      class={`${baseClassesStr} ${active ? shells.active : shells.inactive}`}
      {...styleProps}
    >
      {children}
    </div>
  );
}

