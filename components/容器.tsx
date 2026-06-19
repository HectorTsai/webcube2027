// 容器.tsx (2026 新版 — 方塊:方塊:容器 自足元件)
// 將 Container.tsx 移至此，舊 Container/ 目錄為舊版 variant 系統不動
import { processChildren } from "./index.ts"; 
import { BaseComponentProps, 過濾無效Props } from "./classes.ts";

export interface 容器Props extends BaseComponentProps {
  hover?: boolean;
  active?: boolean;
  activeStateName?: string; 
}

export default function 容器(props: 容器Props) {
  const PADDING_MAP: Record<string, string> = {
    none: "p-0", xs: "p-1", sm: "p-2", md: "p-4", lg: "p-6", xl: "p-8",
  };
  const { 
    color = "primary", 
    active = true, 
    activeStateName, 
    hover = false, 
    children, 
    className = "", 
    style, 
    context, 
    width,     
    height,
    padding,
  } = props;

  const 實際供電色彩 = (!active && !activeStateName) ? "neutral" : color;

  const scopedStyles = {
    '--c-current': `var(--color-${實際供電色彩}-raw)`,
    '--c-current-content': `var(--color-${實際供電色彩}-content-raw)`,
    
    ...[10, 30, 50, 70, 90].reduce((acc, step) => {
      acc[`--c-current-${step}`] = `var(--color-${實際供電色彩}-${step}-raw)`;
      return acc;
    }, {} as Record<string, string>),

    '--c-width': width || 'auto',
    '--c-height': height || 'auto',
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),

    ...style 
  };

  const 智慧分發Children = processChildren(children, { context: { ...context, color: 實際供電色彩, active, activeStateName, hover } });

  const 最終盲倒Class = ['c-style-apply c-div-active c-div-hover c-div-inactive box-border', className, padding && PADDING_MAP[padding]].filter(Boolean).join(" ").replace(/\s+/g, ' ');

  if (activeStateName) {
    return (
      <div
        class={最終盲倒Class}
        style={scopedStyles}
        x-init={`if(!Alpine.store('Container')){Alpine.store('Container',{})}if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}`}
        x-effect={`$el.setAttribute('data-active',$store.Container.${activeStateName}?'true':'false')`}
        data-hover={hover ? "true" : "false"} 
        {...過濾無效Props(props)} 
      >
        {智慧分發Children}
      </div>
    );
  }

  return (
    <div
      class={最終盲倒Class}
      style={scopedStyles}
      data-active={active ? "true" : "false"} 
      data-hover={hover ? "true" : "false"}   
      {...過濾無效Props(props)} 
    >
      {智慧分發Children}
    </div>
  );
}
