// 容器.tsx (2026 新版 — 方塊:方塊:容器 自足元件)
import { processChildren } from "./index.ts"; 
import { BaseComponentProps, 過濾無效Props } from "./classes.ts";
import { jsx } from "hono/jsx/jsx-runtime";

export interface 容器Props extends BaseComponentProps {
  hover?: boolean;
  active?: boolean;
  activeStateName?: string; 
  /** 來自列表等子方塊的 wrapChild 定義，在 processChildren 展開後逐項於 Runtime 進行獨立包裝 */
  wrapChild?: { from: string; className?: string; style?: Record<string, string> };
}

// 專門打平 Hono JSX children 的巢狀陣列（看穿 Hono Fragment 或者是執行期推入的陣列）
function flattenChildren(arr: any): any[] {
  if (arr === undefined || arr === null) return [];
  if (Array.isArray(arr)) return arr.flatMap(flattenChildren);
  if (arr && typeof arr === 'object') {
    if (arr.tag === '' || arr.tag === undefined) {
      const inner = arr.props?.children || arr.children;
      if (inner !== undefined) return flattenChildren(inner);
    }
  }
  return [arr];
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
    wrapChild
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

  // 1. 透過核心引擎解構插槽與展開子節點（此時不論 JSON 是原生 div 還是自訂方塊，在 Runtime 都會被排進乾淨的 Array）
  let 智慧分發Children = processChildren(children, { context: { ...context, color: 實際供電色彩, active, activeStateName, hover } });

  // 2. 🛡️ 核心守衛：如果帶有 wrapChild 定義，於 Runtime 對一維陣列逐項點名包裝
  if (wrapChild && 智慧分發Children !== undefined && 智慧分發Children !== null) {
    const flatSubChildren = flattenChildren(智慧分發Children);
    
    智慧分發Children = flatSubChildren.map(child => {
      if (child === undefined || child === null) return null;
      
      const wTag = wrapChild.from || "div";
      const wProps: Record<string, unknown> = {};
      if (wrapChild.className) wProps.class = wrapChild.className;
      if (wrapChild.style) wProps.style = wrapChild.style;
      
      // 提升子項目的角色或無障礙屬性（如 role="separator"）至外層包裝標籤 (如 <li>)
      if (child && typeof child === 'object' && 'props' in child) {
        const cp = (child as any).props || {};
        for (const [k, v] of Object.entries(cp)) {
          if ((k === 'role' || k.startsWith('aria-')) && v !== undefined && v !== '') {
            wProps[k] = v;
          }
        }
      }
      return jsx(wTag, { ...wProps, children: child } as any);
    }) as any;
  }

  const 最終盲倒Class = ['c-style-apply c-div-active c-div-hover c-div-inactive box-border', className, padding && PADDING_MAP[padding]].filter(Boolean).join(" ").replace(/\\s+/g, ' ');

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