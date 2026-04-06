import { jsx } from "hono/jsx/jsx-runtime";

/**
 * 創建動態 variant 元件
 * @param componentName 元件名稱
 * @param defaultVariant 預設 variant
 * @returns 動態載入 variant 的元件函數
 */
export default function createVariantComponent(
  componentName: string,
  defaultVariant: string = "solid"
) {
  return async function VariantComponent({ variant = defaultVariant, ...props }: any) {
    try {
      // 動態載入指定的 variant
      const variantModule = await import(`./${componentName}/${variant}.tsx`);
      const Component = variantModule.default;
      
      if (!Component) {
        throw new Error(`Component ${componentName}/${variant} has no default export`);
      }
      
      return jsx(Component, { ...props });
    } catch (_e) {
      // 如果載入失敗，嘗試載入預設 variant
      try {
        const defaultModule = await import(`./${componentName}/${defaultVariant}.tsx`);
        const DefaultComponent = defaultModule.default;
        
        if (!DefaultComponent) {
          throw new Error(`Component ${componentName}/${defaultVariant} has no default export`);
        }
        
        return jsx(DefaultComponent, { ...props });
      } catch (_err) {
        // 最終退回：顯示清楚的錯誤訊息
        return jsx("div", {}, `${componentName}:${variant}`);
      }
    }
  };
}
