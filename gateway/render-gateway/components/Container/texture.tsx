import type { ContainerProps } from "./index.tsx";
import { 準備Container基底 } from "./index.tsx";
import { InnerAPI } from "../../services/index.ts";
import {
  color2TextColor,
  adjustColorLightOrOpacity,
  過濾無效Props,
} from "../classes.ts";
import { processChildren } from "../index.ts";

function 產生TextureClasses(params: {
  baseClasses: string[];
  color: string;
  active: boolean;
  hover: boolean;
}) {
  const { baseClasses, color, active, hover } = params;

  const classes = [...baseClasses];

  const textColor = active ? `text-${color}` : "text-base-content";
  const hoverBg = active ? adjustColorLightOrOpacity(color, 20, 0) : "base-70";
  const hoverTextColor = active ? `hover:${color2TextColor(color)}` : "hover:text-base-content";

  if (hover) {
    classes.push(textColor, `hover:bg-${hoverBg}`, hoverTextColor);
  } else {
    classes.push(textColor);
  }

  return classes;
}

function 產生TextureAlpineClasses(params: {
  baseClasses: string[];
  color: string;
}) {
  const { baseClasses, color } = params;
  const baseClassesStr = baseClasses.join(" ");

  const activeFullClasses = `${baseClassesStr} text-${color}`;
  const activeHoverClasses = `${baseClassesStr} hover:bg-${adjustColorLightOrOpacity(color, 20, 0)} hover:${color2TextColor(color)}`;
  const inactiveFullClasses = `${baseClassesStr} text-base-content`;
  const inactiveHoverClasses = `${baseClassesStr} hover:bg-base-70 hover:text-base-content`;

  return { activeFullClasses, activeHoverClasses, inactiveFullClasses, inactiveHoverClasses };
}

export default async function TextureContainer(props: ContainerProps) {
  const { children, color = "primary", active = true, activeStateName, hover = false, context, ...rest } = props;

  const processedChildren = processChildren(children, { color });

  let image = "";
  try {
    const skeleton: any = context?.get?.("skeleton");
    image = skeleton?.風格?.pattern || "圖示:圖示:紋理";
  } catch (_e) {
    image = "圖示:圖示:紋理";
  }

  const bgStyle: Record<string, string> = image ? {
    backgroundImage: `url('/media/v1/icon/${image}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } : {};

  if(context){
    const response = await InnerAPI(context, `/media/v1/icon/${image}`);
    if (response.ok) {
        const svgContent = await response.text();
        console.log(svgContent);
        if (svgContent.trim().startsWith('<svg')) {
        bgStyle.backgroundImage =  `url('data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}')`;
        }
    }
  }
  const { inlineStyles, baseClassesStr } = 準備Container基底(props);

  if (activeStateName) {
    const initScript = `
      if(!Alpine.store('Container')){Alpine.store('Container',{})}
      if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}
    `.replace(/\s+/g, ' ').trim();

    const baseClasses = baseClassesStr.split(" ");
    const { activeFullClasses, activeHoverClasses, inactiveFullClasses, inactiveHoverClasses } = 產生TextureAlpineClasses({ baseClasses, color });

    if (hover) {
      return (
        <div
          x-data="{ hover: false }"
          x-init={initScript}
          x-on:mouseenter="hover = true"
          x-on:mouseleave="hover = false"
          x-bind:class={`$store.Container.${activeStateName} ? (hover ? '${activeHoverClasses}' : '${activeFullClasses}') : (hover ? '${inactiveHoverClasses}' : '${inactiveFullClasses}')`}
          style={{ ...inlineStyles, ...bgStyle }}
          {...過濾無效Props(rest)}
        >
          {processedChildren}
        </div>
      );
    }

    return (
      <div
        x-data
        x-init={initScript}
        x-bind:class={`$store.Container.${activeStateName} ? '${activeFullClasses}' : '${inactiveFullClasses}'`}
        style={{ ...inlineStyles, ...bgStyle }}
        {...過濾無效Props(rest)}
      >
        {processedChildren}
      </div>
    );
  }

  const baseClasses = baseClassesStr.split(" ");
  const classes = 產生TextureClasses({ baseClasses, color, active, hover });

  return (
    <div
      class={classes.filter(Boolean).join(" ")}
      style={{ ...inlineStyles, ...bgStyle }}
      {...過濾無效Props(rest)}
    >
      {processedChildren}
    </div>
  );
}