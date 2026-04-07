import { jsx } from "hono/jsx/jsx-runtime";
import { InnerAPI } from "../services/index.ts";

/**
 * 創建動態 variant 元件
 * @param componentName 元件名稱
 * @param defaultVariant 預設 variant
 * @returns 動態載入 variant 的元件函數
 */
export default function createVariantComponent(componentName: string, defaultVariant: string = "solid") {
  return async function VariantComponent({ variant = defaultVariant, ...props }: any) {
    try {
      // 如果有 context 則去骨架讀取覆蓋      
      if(props && props.context){
        try {
          const context = props.context;
          const res = await InnerAPI(context, `/api/v1/skeleton`);
          if(res.ok){
            const data = await res.json();
            const skeleton = data.skeleton;
            if(skeleton && skeleton.風格){
              variant = skeleton.風格[componentName] ?? skeleton.風格["default"] ?? variant;
            }
          }
        } catch (_e) {
          // 不用處理！使用 defaultVariant
        }
      }
      // 動態載入指定的 variant
      const variantModule = await import(`./${componentName}/${variant}.tsx`);
      const Component = variantModule.default;
      
      if (!Component) {
        throw new Error(`Component ${componentName}/${variant} has no default export`);
      }
      
      // 調用組件並等待結果
      const result = await Component(props);
      return result;
    } catch (_e) {
      // 如果載入失敗，嘗試載入預設 variant
      try {
        const defaultModule = await import(`./${componentName}/${defaultVariant}.tsx`);
        const DefaultComponent = defaultModule.default;
        
        if (!DefaultComponent) {
          throw new Error(`Component ${componentName}/${defaultVariant} has no default export`);
        }
        
        // 調用組件並等待結果
        const result = await DefaultComponent(props);
        return result;
      } catch (_err) {
        // 最終退回：顯示清楚的錯誤訊息
        return jsx("div", {}, `${componentName}:${variant}`);
      }
    }
  };
}
