// Container.tsx (2026 方案甲 - 變體盲倒完全體)
import { processChildren } from "./index.ts"; 
import { BaseComponentProps, 過濾無效Props } from "./classes.ts";

export interface ContainerProps extends BaseComponentProps {
  hover?: boolean;
  active?: boolean;
  activeStateName?: string; 
}

export default function Container(props: ContainerProps) {
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
    ...rest 
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
    '--c-padding': padding 
      ? (['sm', 'md', 'lg', 'xl'].includes(padding) ? `var(--spacing-${padding})` : padding) 
      : 'unset',

    ...style 
  };

  const 智慧分發Children = processChildren(children, { context: { ...context, color: 實際供電色彩, active, activeStateName, hover } });

  // 📦 4. 方案甲終極震撼彈：完全依據您的頂峰直覺，盲倒現代化、無衝突的變體組合！
  const 最終盲倒Class = `c-style-apply c-div-active hover:c-div-hover inactive:c-div-inactive ${className}`.trim().replace(/\s+/g, ' ');

  if (activeStateName) {
    return (
      <div
        class={最終盲倒Class}
        style={scopedStyles}
        x-init={`if(!Alpine.store('Container')){Alpine.store('Container',{})}if(Alpine.store('Container').${activeStateName}===undefined){Alpine.store('Container').${activeStateName}=${active}}`}
        x-bind:data-active={`$store.Container.${activeStateName} ? 'true' : 'false'`}
        x-bind:style={`!$store.Container.${activeStateName} ? '--c-current: var(--color-neutral-raw); --c-current-content: var(--color-neutral-content-raw); --c-current-50: var(--color-neutral-50-raw); --c-current-70: var(--color-neutral-70-raw); --c-current-90: var(--color-neutral-90-raw);' : ''`}
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