// Container/diagonal-stripes.tsx - 斜線條紋：主色帶 + 同系淺帶交替
import { 準備Container基底, ContainerProps } from "./index.tsx";
import {
  parseColor,
  color2TextColor,
  色票CSS變數名稱,
  色票色相,
  CONTAINER_STORE_INIT,
  過濾無效Props,
} from "../classes.ts";

function 條紋漸層(mainVar: string, bandVar: string, alphaSuffix: string, angle: number): string {
  const band = `oklch(var(--color-${bandVar})${alphaSuffix})`;
  const main = `oklch(var(--color-${mainVar}))`;
  return `repeating-linear-gradient(${angle}deg, ${main} 0px, ${main} 10px, ${band} 10px, ${band} 20px)`;
}

export default function DiagonalStripesContainer(props: ContainerProps) {
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);
  const { color = "primary", active = true, activeStateName, hover = false, children, ...rest } = props;

  const parsed = parseColor(color);
  const transitionClass = hover ? "transition-all duration-300 ease-out" : "";
  const opacityAlphaStr = parsed.opacity !== undefined ? ` / ${parsed.opacity / 100}` : "";

  const hue = 色票色相(color);
  const actMainVar = 色票CSS變數名稱(hue);
  const actBandVar = 色票CSS變數名稱(`${parsed.base}-70`);

  const activeText = color2TextColor(color);
  const activeShadow = hover ? `hover:shadow-md hover:shadow-${parsed.base}/30` : "";
  const actStripeNormal = 條紋漸層(actMainVar, actBandVar, opacityAlphaStr, 45);
  const actStripeHover = 條紋漸層(actMainVar, actBandVar, opacityAlphaStr, -45);

  const inactiveText = "text-base-content";
  const inactiveShadow = hover ? `hover:shadow-md hover:shadow-base/30` : "";
  const baseBandVar = 色票CSS變數名稱("base-70");
  const inactStripeNormal = 條紋漸層(baseBandVar, baseBandVar, " / 0.5", 45);
  const inactStripeHover = 條紋漸層(baseBandVar, baseBandVar, opacityAlphaStr, -45);

  const hoverMouse = hover
    ? { "x-on:mouseenter": "envHover = true", "x-on:mouseleave": "envHover = false" } as const
    : {};

  const shellProps = {
    "x-data": hover ? "{ envHover: false }" : undefined,
    ...hoverMouse,
    class: `${baseClassesStr} ${transitionClass}`.trim(),
    style: inlineStyles,
    ...過濾無效Props(rest),
  };

  if (activeStateName) {
    const store = `$store.Container.${activeStateName}`;
    return (
      <div
        {...shellProps}
        x-init={CONTAINER_STORE_INIT(activeStateName, active)}
        x-bind:style={hover
          ? `${store} ? (envHover ? { 'background-image': '${actStripeHover}' } : { 'background-image': '${actStripeNormal}' }) : (envHover ? { 'background-image': '${inactStripeHover}' } : { 'background-image': '${inactStripeNormal}' })`
          : `${store} ? { 'background-image': '${actStripeNormal}' } : { 'background-image': '${inactStripeNormal}' }`}
        x-bind:class={`${store} ? '${activeText} ${activeShadow}' : '${inactiveText} ${inactiveShadow}'`}
      >
        {children}
      </div>
    );
  }

  const currentText = active ? activeText : inactiveText;
  const currentShadow = active ? activeShadow : inactiveShadow;
  const currentStripeNormal = active ? actStripeNormal : inactStripeNormal;
  const currentStripeHover = active ? actStripeHover : inactStripeHover;

  if (hover) {
    return (
      <div
        {...shellProps}
        class={`${baseClassesStr} ${currentText} ${currentShadow} ${transitionClass}`}
        style={{ ...inlineStyles, backgroundImage: currentStripeNormal }}
        x-bind:style={`envHover ? { 'background-image': '${currentStripeHover}' } : { 'background-image': '${currentStripeNormal}' }`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      class={`${baseClassesStr} ${currentText}`}
      style={{ ...inlineStyles, backgroundImage: currentStripeNormal }}
      {...過濾無效Props(rest)}
    >
      {children}
    </div>
  );
}
