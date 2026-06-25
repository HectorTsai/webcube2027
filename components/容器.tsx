// 容器.tsx (2026 新版 — 方塊:方塊:容器 自足元件)
import { processChildren } from "./index.ts"; 
import { BaseComponentProps, 過濾無效Props } from "./classes.ts";
import { jsx } from "hono/jsx/jsx-runtime";
import { Children } from "hono/jsx";

export interface 容器Props extends BaseComponentProps {
  hover?: boolean;
  active?: boolean;
  activeStateName?: string;
  border?: string;
  shadow?: string;
  rounded?: string;
  direction?: string;
  /** 來自列表等子方塊的 wrapChild 定義，在 processChildren 展開後逐項於 Runtime 進行獨立包裝 */
  wrapChild?: { from: string; className?: string; style?: Record<string, string> };
}

export default function 容器(props: 容器Props) {
  const PADDING_MAP: Record<string, string> = {
    none: "p-0", xs: "p-1", sm: "p-2", md: "p-4", lg: "p-6", xl: "p-8",
  };
  const BORDER_MAP: Record<string, string> = {
    none: "!border-0", solid: "", dashed: "!border-dashed", dotted: "!border-dotted", double: "!border-double",
  };
  const SHADOW_MAP: Record<string, string> = {
    none: "shadow-none", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl",
  };
  const ROUNDED_MAP: Record<string, string> = {
    none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl",
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
    border = "solid",
    shadow = "sm",
    rounded = "md",
    direction = "col",
    wrapChild
  } = props;

  const 實際供電色彩 = (!active && !activeStateName) ? "neutral" : color;

  const scopedStyles: Record<string, string> = {
    '--c-current': `var(--color-${實際供電色彩}-raw)`,
    '--c-current-content': `var(--color-${實際供電色彩}-content-raw)`,
    '--c-current-10': `var(--color-${實際供電色彩}-10-raw)`,
    '--c-current-30': `var(--color-${實際供電色彩}-30-raw)`,
    '--c-current-50': `var(--color-${實際供電色彩}-50-raw)`,
    '--c-current-70': `var(--color-${實際供電色彩}-70-raw)`,
    '--c-current-90': `var(--color-${實際供電色彩}-90-raw)`,
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
    const flatSubChildren = (Children.toArray(智慧分發Children as any) as any[]).flat(Infinity) as any[];
    
    智慧分發Children = flatSubChildren.map(child => {
      if (child === undefined || child === null) return null;
      
      const wTag = wrapChild.from || "div";
      const wProps: Record<string, unknown> = {};
      if (wrapChild.className) wProps.class = wrapChild.className;
      if (wrapChild.style) wProps.style = wrapChild.style;
      
      // 提升子項目的角色或無障礙屬性（如 role="separator"）至外層包裝標籤 (如 <li>)
      // 🎯 效能優化：精準提取 role 和 aria-* 屬性，避免遍歷整個 props 物件
      if (child && typeof child === 'object' && 'props' in child) {
        const cp = (child as any).props || {};
        if (cp.role !== undefined && cp.role !== '') wProps.role = cp.role;
        for (const k in cp) {
          if (k.startsWith('aria-') && cp[k] !== undefined && cp[k] !== '') {
            wProps[k] = cp[k];
          }
        }
      }
      return jsx(wTag, { ...wProps, children: child } as any);
    }) as any;
  }

  const 邊框覆蓋 = BORDER_MAP[border] || "";
  const 陰影覆蓋 = shadow !== "sm" ? `!${SHADOW_MAP[shadow]}` : "";
  const 圓角值 = ROUNDED_MAP[rounded] || "";
  const 方向值 = direction === "row" ? "!flex-row" : "";

  const 最終盲倒Class = ['c-style-apply c-div-active c-div-hover c-div-inactive box-border', 邊框覆蓋, 陰影覆蓋, 圓角值, 方向值, className, padding && PADDING_MAP[padding]].filter(Boolean).join(" ").replace(/\\s+/g, ' ');

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