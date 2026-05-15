import { jsx } from "hono/jsx/jsx-runtime";
import { InnerAPI } from "../services/index.ts";
import 骨架 from "../database/models/骨架.ts";

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

  return async function VariantComponent({ variant, ...props }: any) {
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
}