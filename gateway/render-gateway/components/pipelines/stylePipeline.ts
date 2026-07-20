// pipelines/stylePipeline.ts — 視覺樣式與條件特化管線
// 職責：專職處理 CSS 類名（Tailwind）與內聯 Style 的融合與計算。
//       ① 融合 definition.className / style 與 variant 產出的 className / style
//       ② 動態條件解析 styleConditions
// 死鐵律：不准處理 HTML 屬性、不准處理 Alpine、不准處理 DOM 結構。
//
// 🏎️ Phase 1（變體值傳播）已完全內聚至 argsPipeline.ts 步驟 4.5 執行，
//   本管線已退化為純無副作用的 Phase 2 計算，可完全平行於 Wave 3 其他管線。
import { 智慧插值, 純模板正則, 含模板正則 } from "../../utils/安全過濾器.ts";

const isTemplate = (v: any): boolean => typeof v === "string" && 純模板正則.test(v);

export interface StyleProps {
  className: string;
  style: Record<string, string>;
  alpineAttrs?: Record<string, string>; // 動態 Alpine :class 綁定（由 styleConditions 未解析變數產生）
}

/**
 * Phase 2：純計算樣式輸出（無副作用，可平行執行）
 * Phase 1 變體值傳播已移入 argsPipeline.ts（步驟 4.5），由 argsPipeline 在集中化插值前執行。
 */
export function 運行樣式與條件管線(
  definition: any,
  localArgs: Record<string, unknown>,
  envColor?: string,
): StyleProps {
  // 合併 definition.className（區塊級固定類名）與 localArgs.className（使用者傳入的動態類名）
  let finalClassName = [
    definition.className,
    isTemplate(localArgs.className) ? "" : localArgs.className,
  ].filter(Boolean).join(" ") || "";
  const finalStyle: Record<string, string> = { ...(definition.style || {}) };

  // Phase 2：收集 className / style 到輸出
  //    僅對包含 {key} 模板的 variant className/style 進行插值。
  //    靜態值（純 Tailwind class）直接使用，不做多餘的 智慧插值呼叫。
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
      const runtimeVal = localArgs[key];
      if (runtimeVal === undefined) continue;
      const v = argDef.variants?.[String(runtimeVal)];
      if (!v) continue;
      if (v.className) {
        const resolvedClass = typeof v.className === "string" && 含模板正則.test(v.className)
          ? 智慧插值(v.className, localArgs)
          : v.className;
        finalClassName = [finalClassName, resolvedClass].filter(Boolean).join(" ");
      }
      if (v.style) {
        for (const [sk, sv] of Object.entries(v.style)) {
          finalStyle[sk] = typeof sv === "string" && 含模板正則.test(sv)
            ? 智慧插值(sv, localArgs)
            : (typeof sv === "string" ? sv : String(sv));
        }
      }
    }
  }

  // styleConditions 動態類名（雙軌：SSR 靜態 + Alpine 動態）
  const dynamicClassMap: string[] = [];
  if (definition.styleConditions) {
    for (const [key, classNameValue] of Object.entries(definition.styleConditions as Record<string, string>)) {
      const rawValue = localArgs[key];
      if (!classNameValue) continue;

      if (rawValue === true) {
        // 伺服器端已知為 true → 靜態寫入 className
        finalClassName = [finalClassName, classNameValue].filter(Boolean).join(" ");
      } else if (rawValue === undefined) {
        // 伺服器端未知 → 轉譯為 Alpine :class 動態綁定，由前端控制（如表單錯誤變色）
        dynamicClassMap.push(`'${classNameValue}': ${key}`);
      } else if (typeof rawValue === "string" && (rawValue.includes("$") || rawValue.includes("."))) {
        // Alpine 表達式（如 "$store.form.hasError"）→ 直接作為 :class 條件
        dynamicClassMap.push(`'${classNameValue}': ${rawValue}`);
      }
      // rawValue === false → 不輸出（無論伺服器或客戶端）
    }
  }

  // 顏色：優先 localArgs.color（跳過 "current" 讓它從 envColor 繼承），fallback envColor
  const effectiveColor = (localArgs.color && localArgs.color !== "current") ? localArgs.color : envColor;
  if (effectiveColor) finalClassName = `${finalClassName} cube-color-${effectiveColor}`.trim();

  const result: StyleProps = { className: finalClassName, style: finalStyle };

  if (dynamicClassMap.length > 0) {
    result.alpineAttrs = { ":class": `{ ${dynamicClassMap.join(", ")} }` };
  }

  return result;
}
