import type { ContainerProps } from "./index.tsx";
import { 準備Container基底 } from "./index.tsx";
import 骨架 from "../../database/models/骨架.ts";
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
  image: string;
}) {
  const { baseClasses, color, active, hover, image } = params;

  const classes = [...baseClasses];

  const textColor = active ? `text-${color}` : "text-base-content";
  const hoverBg = active ? adjustColorLightOrOpacity(color, 20, 0) : "base-70";
  const hoverTextColor = active ? `hover:${color2TextColor(color)}` : "hover:text-base-content";

  const bgStyle = `background-image: url('${image}'); background-size: cover; background-position: center;`;

  if (hover) {
    classes.push(textColor, `hover:bg-${hoverBg}`, hoverTextColor, bgStyle);
  } else {
    classes.push(textColor, bgStyle);
  }

  return classes;
}

function 產生TextureAlpineClasses(params: {
  baseClasses: string[];
  color: string;
  image: string;
}) {
  const { baseClasses, color, image } = params;
  const baseClassesStr = baseClasses.join(" ");

  const bgStyle = `background-image: url('${image}'); background-size: cover; background-position: center;`;

  const activeFullClasses = `${baseClassesStr} text-${color} ${bgStyle}`;
  const activeHoverClasses = `${baseClassesStr} hover:bg-${adjustColorLightOrOpacity(color, 20, 0)} hover:${color2TextColor(color)} ${bgStyle}`;
  const inactiveFullClasses = `${baseClassesStr} text-base-content ${bgStyle}`;
  const inactiveHoverClasses = `${baseClassesStr} hover:bg-base-70 hover:text-base-content ${bgStyle}`;

  return { activeFullClasses, activeHoverClasses, inactiveFullClasses, inactiveHoverClasses };
}

export function createTextureContainer() {
  return function TextureContainer(props: ContainerProps) {
    const { children, color = "primary", active = true, activeStateName, hover = false, context, ...rest } = props;

    const processedChildren = processChildren(children, { color });

    const skeleton:骨架 = context.get("骨架");
    const image = skeleton.風格.image || "";

    const { inlineStyles, baseClassesStr } = 準備Container基底(props);

    if (activeStateName) {
      const initScript = `
        if(!Alpine.store('Container')){Alpine.store('Container',{})}
        if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}
      `.replace(/\s+/g, ' ').trim();

      const baseClasses = baseClassesStr.split(" ");
      const { activeFullClasses, activeHoverClasses, inactiveFullClasses, inactiveHoverClasses } = 產生TextureAlpineClasses({ baseClasses, color, image });

      if (hover) {
        return (
          <div
            x-data="{ hover: false }"
            x-init={initScript}
            x-on:mouseenter="hover = true"
            x-on:mouseleave="hover = false"
            x-bind:class={`$store.Container.${activeStateName} ? (hover ? '${activeHoverClasses}' : '${activeFullClasses}') : (hover ? '${inactiveHoverClasses}' : '${inactiveFullClasses}')`}
            style={inlineStyles}
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
          style={inlineStyles}
          {...過濾無效Props(rest)}
        >
          {processedChildren}
        </div>
      );
    }

    const baseClasses = baseClassesStr.split(" ");
    const classes = 產生TextureClasses({ baseClasses, color, active, hover, image });

    return (
      <div
        class={classes.filter(Boolean).join(" ")}
        style={inlineStyles}
        {...過濾無效Props(rest)}
      >
        {processedChildren}
      </div>
    );
  };
}

export default createTextureContainer();