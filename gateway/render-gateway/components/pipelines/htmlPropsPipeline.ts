// pipelines/htmlPropsPipeline.ts — 純 HTML 原生屬性映射管線
// 職責：職責極度退化，只負責把剩餘的合法 localArgs 與 definition.attrs
//       映射為 W3C 標準 HTML 原生屬性。
// 死鐵律：只看經過前面所有流水線清洗後留下的乾淨變數，
//         只要變數鍵不在內部消耗清單中，就當作標準 HTML 屬性直接吐出。
import { 智慧插值 } from "../../utils/安全過濾器.ts";

// ── 跳過鍵（內部訊號，不渲染為 HTML 屬性）──
const 跳過Keys = new Set(
  "from args definition children repeat slot styleconditions prepend append wrap classname style context fallbacks slots color text depth $api sharechildren comment if __editor __cube_chain __cube_extracted_slots __cube_slots_resolved __slotname data-active data-hover data-selected data-focus active hover selected focus classname activestatename activeStateName disabled raw apisvg currentyear state title divider stripe padding gap rounded shadow align justify textalign fontsize display underline userselect cursor border direction _五態分類 _mergedargkeys drawerstate __cube_instance_path __all_internal_keys cube_instance_id".split(" "),
);

// ── W3C 標準布林屬性白名單：即使宣告在 args 中且為布林值，也必須透傳到 DOM ──
const W3C_BOOLEAN_ATTRS = new Set([
  "disabled", "readonly", "required", "checked", "multiple", "autofocus",
  "selected", "hidden", "inert", "async", "defer", "default", "ismap",
  "loop", "muted", "nomodule", "novalidate", "open", "reversed",
]);

// ── 允許穿透的 W3C 通用屬性（即使屬於內部消耗鍵也強制輸出）──
const W3C_PASSTHROUGH_ATTRS = new Set([
  "href", "src", "alt", "width", "height", "target", "rel", "type", "name", "value",
]);

export function 編譯純HTML屬性(
  definition: any,
  localArgs: Record<string, unknown>,
): Record<string, any> {
  const attrs: Record<string, any> = {};

  // ① definition.attrs：靜態 HTML 屬性（如 loading="lazy"、type="button"）
  if (definition.attrs) {
    for (const [k, v] of Object.entries(definition.attrs as Record<string, string>)) {
      attrs[k] = 智慧插值(v, localArgs);
    }
  }

  // ② 透傳剩餘合法 localArgs 為 HTML 屬性
  const 繼承合併鍵: Set<string> = localArgs._mergedArgKeys instanceof Set
    ? localArgs._mergedArgKeys
    : new Set();
  for (const [k, v] of Object.entries(localArgs)) {
    const kLow = k.toLowerCase();
    if (typeof k !== "string" || 跳過Keys.has(kLow)) continue;

    // 🔴 熔斷防線：使用 __all_internal_keys（由 argsPipeline 收集的全鏈路內部宣告鍵）
    //    確保 nanoid 血統碼、mergedArgs 解析結果、args/defaults 等永不外洩為 HTML 屬性
    //    ⚠️ 大小寫不敏感比對：同時檢查 k 原始值與 kLow，防止 Disabled vs disabled 穿透
    const isInternalArg =
      (definition.args && (k in definition.args || kLow in definition.args)) ||
      (definition.defaults && (k in definition.defaults || kLow in definition.defaults)) ||
      (definition.mergedArgs && (k in (definition.mergedArgs as Record<string, unknown>) || kLow in (definition.mergedArgs as Record<string, unknown>))) ||
      (definition.__all_internal_keys && (definition.__all_internal_keys.has(k) || definition.__all_internal_keys.has(kLow))) ||
      繼承合併鍵.has(k) || 繼承合併鍵.has(kLow) ||
      kLow === "cube_instance_id" ||
      kLow === "__cube_instance_path";

    if (isInternalArg) {
      // 🔴 W3C 穿透檢查：將 k 轉小寫後比對，確保駝峰命名的內部鍵（如 Disabled）
      //    仍能正確識別為合法 W3C 屬性並穿透到 DOM
      const kLowForW3c = k.toLowerCase();
      const isW3cPassthrough = W3C_BOOLEAN_ATTRS.has(kLowForW3c) || W3C_PASSTHROUGH_ATTRS.has(kLowForW3c);
      if (!isW3cPassthrough) continue;
    }

    // 防線：Object / Function 型態變數絕不洩漏到 DOM
    const valType = typeof v;
    if (valType === "object" || valType === "function") continue;

    // 有 variants 或 options 的 arg → 樣式選擇型，已由 stylePipeline 消耗，不洩漏到 DOM
    if (definition.args?.[k]?.variants || definition.args?.[k]?.options) continue;

    if (k.startsWith("x-") || k.startsWith("@") || (!(k in attrs))) {
      if (valType === "string" || valType === "number" || valType === "boolean") {
        attrs[k] = 智慧插值(v, localArgs);
      }
    }
  }

  return attrs;
}
