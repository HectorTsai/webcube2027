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
      const childType = (child as any).type ?? (child as any).tag;

      // 🛡️ 終極防火牆 A：原生 HTML 元素（tag 為字串，如 "div", "ul"）不需傳遞 baseProps
      if (typeof childType === 'string') return child;

      // 🛡️ 終極防火牆 B：如果子組件是我們的非同步渲染核心 Cube、或是 Variant 封裝組件
      // 由於上游已經完全對齊並注入完畢，絕對禁止對其執行 cloneElement，防止 Hono 非同步 VNode 肉體損壞變字串
      const tagName = childType?.name;
      if (tagName === 'Cube' || tagName === 'VariantComponent' || childType?.toString().includes('Cube')) {
        return child;
      }

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

      // 沒有新屬性時回傳原 child（避免無謂的 cloneElement 可能影響 JSX 內部屬性）
      if (Object.keys(newProps).length === 0) return child;

      return cloneElement(child, newProps);
    }
    return child;
  });
}

// 核心優化點 A：用來記錄失敗的 import 路徑。Deno 無法快取失敗的 import，我們手動幫它阻斷
const INVALID_PATHS = new Set<string>();

async function importComponentModule(componentPath: string, variant: string): Promise<any> {
  const name = componentPath.split('/').pop() || componentPath;
  const paths = [
    `./${componentPath}/${variant}.tsx`,
    `./${componentPath}/index.tsx`,
    `./${componentPath}.tsx`,
    `./${componentPath}/${name}.tsx`,
  ];

  for (const path of paths) {
    // 如果這個路徑在之前的請求中已經失敗過了，直接跳過，避免無意義的磁碟 I/O 阻斷
    if (INVALID_PATHS.has(path)) continue;

    try {
      // 這裡完全交給 Deno 2 原生的 ESM 機制進行高速快取讀取（成功的 import 會自動快取）
      const mod = await import(path);
      if (mod.default) return mod.default;
    } catch {
      INVALID_PATHS.add(path); // 記錄此無效路徑，下次直接跳過
      continue;
    }
  }
  return null;
}

/**
 * 創建動態 variant 元件
 * @param componentPath 元件路徑（如 "Container"）
 */
export default function createVariantComponent(componentPath: string) {
  const componentName = componentPath.split('/').pop() || componentPath;

  async function VariantComponent({ variant, ...props }: any) {
    try {
      // 如果有 context 且使用者未指定 variant，則從骨架讀取預設風格
      if (props && props.context && !variant) {
        try {
          const context = props.context;
          // 優先從 Context 快取讀取骨架，避免重複 API 呼叫
          let skeleton = context.get?.('skeleton');
          
          if (!skeleton) {
            const res = await InnerAPI(context, `/api/v1/skeleton`);
            if (res.ok) {
              const data = await res.json();
              skeleton = new 骨架(data.skeleton);
              
              // 【🔥 關鍵優化修正點】：查到後立刻寫回 Context 快取！
              // 補上這一行後，同一次 SSR 請求內不論渲染多少個組件，都只會呼叫 1 次 API，效能暴增！
              context.set?.('skeleton', skeleton);
            }
          }
          if (skeleton?.風格) {
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
  }

  // 設置函數名稱，這樣可以通過 child.type.name 識別組件
  Object.defineProperty(VariantComponent, 'name', {
    value: componentName,
    writable: false,
    configurable: true
  });

  return VariantComponent;
}