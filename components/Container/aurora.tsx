// Container/aurora.tsx - 極光 mesh：雙層徑向漸層疊加（靜態）
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

const INACTIVE_MESH_COLOR = "base-70";
const CANVAS_SURFACE = "base-70/50";
const AURORA_TEXT = color2TextColor(INACTIVE_MESH_COLOR);
const MESH_ALPHA = 0.45;
const MESH_ALPHA_HOVER = 0.52;
/** 位置微調幅度（%）：每個實例略有不同，hover 時再固定內縮 */
const ANCHOR_JITTER = 10;
const SPREAD_JITTER = 5;
const HOVER_NUDGE = { 左上X: 12, 左上Y: 18, 右下X: -12, 右下Y: -18, 擴散: 8 };

type 極光錨點 = { 左上X: number; 左上Y: number; 右下X: number; 右下Y: number; 擴散: number };

function 承載面底色(): string {
  const { opacity } = parseColor(CANVAS_SURFACE);
  const alpha = opacity !== undefined ? opacity / 100 : 0.5;
  return `oklch(var(--color-${色票CSS變數名稱(INACTIVE_MESH_COLOR)}) / ${alpha})`;
}

function 限制範圍(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function 微調(base: number, jitter: number): number {
  return base + (Math.random() * 2 - 1) * jitter;
}

/** 每個 Aurora 實例抽一組錨點；無動畫，僅靜態位置略有差異 */
function 抽極光錨點(): 極光錨點 {
  return {
    左上X: Math.round(限制範圍(微調(0, ANCHOR_JITTER), 0, 25)),
    左上Y: Math.round(限制範圍(微調(0, ANCHOR_JITTER), 0, 25)),
    右下X: Math.round(限制範圍(微調(100, ANCHOR_JITTER), 75, 100)),
    右下Y: Math.round(限制範圍(微調(100, ANCHOR_JITTER), 75, 100)),
    擴散: Math.round(限制範圍(微調(50, SPREAD_JITTER), 45, 58)),
  };
}

function 錨點轉漸層座標(anchors: 極光錨點, hover: boolean) {
  const n = hover ? HOVER_NUDGE : { 左上X: 0, 左上Y: 0, 右下X: 0, 右下Y: 0, 擴散: 0 };
  const 左上X = 限制範圍(anchors.左上X + n.左上X, 0, 40);
  const 左上Y = 限制範圍(anchors.左上Y + n.左上Y, 0, 40);
  const 右下X = 限制範圍(anchors.右下X + n.右下X, 60, 100);
  const 右下Y = 限制範圍(anchors.右下Y + n.右下Y, 60, 100);
  const 擴散 = 限制範圍(anchors.擴散 + n.擴散, 45, 65);

  return {
    左上: `${左上X}% ${左上Y}%`,
    右下: `${右下X}% ${右下Y}%`,
    擴散: `${擴散}%`,
  };
}

function 建立極光漸層(
  色相: string,
  墨色: number,
  anchors: 極光錨點,
  hover: boolean,
): string {
  const 主色 = 色票CSS變數名稱(色相);
  const 伴色 = 色票CSS變數名稱(adjustColorLightOrOpacity(色相, 40, 0));
  const { 左上, 右下, 擴散 } = 錨點轉漸層座標(anchors, hover);

  return [
    `radial-gradient(at ${左上}, oklch(var(--color-${主色}) / ${墨色}) 0px, transparent ${擴散})`,
    `radial-gradient(at ${右下}, oklch(var(--color-${伴色}) / ${墨色}) 0px, transparent ${擴散})`,
  ].join(", ");
}

function 極光背景樣式(
  inline: Record<string, string>,
  色票: string,
  hover: boolean,
  canvasBg: string,
  anchors: 極光錨點,
) {
  return {
    ...inline,
    backgroundColor: canvasBg,
    backgroundImage: 建立極光漸層(色票色相(色票), hover ? MESH_ALPHA_HOVER : MESH_ALPHA, anchors, hover),
  };
}

type 極光樣式組 = {
  normal: Record<string, string>;
  hover: Record<string, string>;
};

function 建立極光樣式組(
  inline: Record<string, string>,
  色票: string,
  canvasBg: string,
  anchors: 極光錨點,
): 極光樣式組 {
  return {
    normal: 極光背景樣式(inline, 色票, false, canvasBg, anchors),
    hover: 極光背景樣式(inline, 色票, true, canvasBg, anchors),
  };
}

function 建立背景Hover綁定(
  active: 極光樣式組,
  inactive: 極光樣式組,
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

export default function AuroraContainer(props: ContainerProps) {
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);
  const { color: rawColor = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;
  const color = rawColor.toLowerCase();

  const canvasBg = 承載面底色();
  const anchors = 抽極光錨點();
  const activeStyles = 建立極光樣式組(inlineStyles, color, canvasBg, anchors);
  const inactiveStyles = 建立極光樣式組(inlineStyles, INACTIVE_MESH_COLOR, canvasBg, anchors);

  const transitionClass = hover ? "transition-all duration-500 ease-out" : "";
  const surfaceClasses = `${baseClassesStr} ${AURORA_TEXT} ${transitionClass}`.trim();
  const hoverMouse = hover
    ? { "x-on:mouseenter": "envHover = true", "x-on:mouseleave": "envHover = false" } as const
    : {};

  const shellProps = {
    "x-data": hover ? "{ envHover: false }" : undefined,
    ...hoverMouse,
    class: surfaceClasses,
    ...過濾無效Props(rest),
  };

  if (activeStateName) {
    return (
      <div
        {...shellProps}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        x-bind:style={hover
          ? 建立背景Hover綁定(activeStyles, inactiveStyles, { storeKey: activeStateName })
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
        ? { "x-bind:style": 建立背景Hover綁定(activeStyles, inactiveStyles, { isActive: active }) }
        : { style: active ? activeStyles.normal : inactiveStyles.normal })}
    >
      {children}
    </div>
  );
}

