import { jsx } from "hono/jsx/jsx-runtime";
import { Children, cloneElement } from 'hono/jsx';
import { InnerAPI } from "../services/index.ts";
import 骨架 from "../database/models/骨架.ts";

/**
 * 處理 children，自動把 baseProps 傳給子元件（如果子元件沒有指定的話）
 * @param children 要處理的 children
 * @param baseProps 要傳給子元件的基礎屬性（例如 color, variant, context）
 * @param extraPropsFn 選擇性的函數，用來處理每個 child 的額外屬性
 * @returns 處理後的 children
 */
export function processChildren(
  children: any, 
  baseProps: Record<string, any>,
  extraPropsFn?: (child: any, index: number) => Record<string, any>
) {
  // 如果 children 是未定義或 null，直接回傳
  if (children === undefined || children === null) {
    return children;
  }
  
  return Children.toArray(children as any).map((child, index) => {
    if (child && typeof child === 'object' && 'props' in child) {
      const extraProps = extraPropsFn ? extraPropsFn(child, index) : {};
      const newProps: Record<string, any> = {};
      
      // 只在子元件沒有指定的情況下才傳入 baseProps
      Object.entries(baseProps).forEach(([key, value]) => {
        if (child.props[key] === undefined) {
          newProps[key] = value;
        }
      });
      
      // 合併 extraProps
      Object.assign(newProps, extraProps);
      
      return cloneElement(child, newProps);
    }
    return child;
  });
}

async function importComponentModule(componentPath: string, variant: string): Promise<any> {
  const name = componentPath.split('/').pop() || componentPath;
  const paths = [
    `./${componentPath}/${variant}.tsx`,
    `./${componentPath}/index.tsx`,
    `./${componentPath}.tsx`,
    `./${componentPath}/${name}.tsx`,
  ];
  for (const path of paths) {
    try {
      const mod = await import(path);
      if (mod.default) return mod.default;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * 創建動態 variant 元件
 * @param componentPath 元件路徑（如 "Container"、"Select/Option"）
 * @returns 動態載入 variant 的元件函數
 */
export default function createVariantComponent(componentPath: string) {
  const componentName = componentPath.split('/').pop() || componentPath;

  async function VariantComponent({ variant, ...props }: any) {
    try {
      // 如果有 context 且使用者未指定 variant，則從骨架讀取預設風格
      if(props && props.context && !variant){
        try {
          const context = props.context;
          // 優先從 Context 快取讀取骨架，避免重複 API 呼叫
          let skeleton = context.get?.('skeleton');
          if (!skeleton) {
            const res = await InnerAPI(context, `/api/v1/skeleton`);
            if(res.ok){
              const data = await res.json();
              skeleton = new 骨架(data.skeleton);
            }
          }
          if(skeleton?.風格){
            variant = skeleton.風格[componentName] ?? skeleton.風格["default"];
          }
        } catch (_e) {
          // 不用處理
        }
      }

      // 最終預設值
      variant = variant || "solid";

      // 嘗試載入指定的 variant
      let Component = await importComponentModule(componentPath, variant);
      if (!Component) {
        Component = await importComponentModule(componentPath, "solid");
      }

      if (!Component) {
        return jsx("div", {}, `${componentPath}:${variant}`);
      }

      const result = await Component({ variant, ...props });
      return result;
    } catch (_e) {
      return jsx("div", {}, `${componentPath}:${variant}`);
    }
  };

  // 設置函數名稱，這樣可以通過 child.type.name 識別組件
  Object.defineProperty(VariantComponent, 'name', {
    value: componentName,
    writable: false,
    configurable: true
  });

  return VariantComponent;
}