// pipelines/childPipeline.ts — 子級資料隔離與縱向傳播管線 (v3 白名單版)
// 職責：在父方塊遍歷 children 準備遞迴時，進行資料清洗與環境隔離：
//       ① 白名單安全繼承：僅允許基礎白名單 + overrideKeys 穿透，預設隔離一切
//       ② 精準下放環境變數（item / index / color / state 等跨組件合約鍵）
// 死鐵律：它是子方塊防污染的「第一道防線」，確保遞迴數據鏈路純淨。
//        不做任何 智慧插值 — 模板解析全權交給 argsPipeline 統一發電。

// ── 基礎白名單（唯一允許預設穿透的鍵）──
// 不在白名單中的鍵，必須由子方塊 JSON 中的 {key} 模板顯式宣告（overrideKeys）才會穿透
const 基礎白名單 = new Set([
  "item",            // repeat 迴圈當前項目
  "index",           // repeat 迴圈索引
  "currentYear",     // 年份上下文（env 注入）
  "color",           // 主題色：供子方塊 cube-color-{color} 穿透
  "state",           // Alpine store 狀態名稱（跨組件合約，如 drawer ↔ button）
  "drawerState",     // 抽屜狀態名稱（主選單 → 抽屜按鈕 → 抽屜 三層穿透）
  "_mergedArgKeys",  // 🔴 父層 mergedArgs 內部鍵集合（供 htmlPropsPipeline 防洩漏）
]);

// ── 結構鍵（JSON 內部保留字／結構用鍵，不作為子方塊 args）──
// ⚠️ 用於 提取子覆寫 的黑名單過濾（結構鍵應從不洩漏到 HTML 屬性）
const 結構鍵 = new Set([
  "from", "args", "defaults", "children", "prepend", "append",
  "styleconditions", "wrap", "slot", "repeat", "fallbacks",
  "comment", "if", "style", "definition", "__editor", "__slotname",
  "classname", "on", "data", "alpine", "tag", "text", "raw",
]);

// 🔴 保留舊版黑名單匯出：供外部既有模組（stylePipeline / htmlPropsPipeline 等）
//    檢查用，避免全域重構波及其他管線
const 父級隱私鍵 = new Set([
  "id", "tag", "attrs", "raw", "mergeRaw", "apiSvg", "apiSrc",
  "svg", "src",
  "from", "defaults", "mergedArgs", "slots", "slot", "wrap",
  "prepend", "append", "repeat", "styleConditions", "fallbacks",
  "__cube_chain", "__cube_extracted_slots", "__cube_slots_resolved",
  "definition", "depth", "context", "children", "env",
]);

const 外貌傳播鍵 = new Set([
  "className", "style", "border", "shadow", "padding", "gap", "align", "justify",
  "width", "height", "rounded", "fontSize", "textAlign", "display", "cursor",
  "underline", "userSelect", "overlay", "direction", "color",
  "active", "hover", "focus", "selected", "disabled", "activeStateName",
]);

export { 基礎白名單, 結構鍵, 父級隱私鍵, 外貌傳播鍵 };

// 🏎️ 基礎允許鍵快取（無 overrideKeys 的最常見路徑，避免每次 new Set）
const 基礎允許鍵快取 = new Set(基礎白名單);

export interface ChildCleanResult {
  子資料: Record<string, unknown>;
  純淨定義: any; // 剝除結構鍵與內部訊號後的子定義
}

/**
 * 🔒 安全子級環境清洗（白名單哲學）
 * 預設隔離所有父級資料，僅允許基礎白名單或 overrideKeys 穿透
 * @param parentLocalArgs 父層的 localArgs
 * @param extraData       子節點自帶的覆寫資料（經 提取子覆寫 前處理）
 * @param overrideKeys    子方塊 JSON 中明確宣告的 {key} 模板鍵集合
 * @returns 清洗後的子資料
 */
export function 清洗子級環境(
  parentLocalArgs: Record<string, unknown>,
  extraData: Record<string, unknown>,
  overrideKeys?: Set<string>,
): Record<string, unknown> {
  const 子資料: Record<string, unknown> = {};

  // ① 白名單篩選：僅穿透基礎白名單 + overrideKeys
  //    🏎️ 常見路徑（無 overrideKeys）直接使用快取 Set，避免重複分配
  const 允許鍵 = (overrideKeys && overrideKeys.size > 0)
    ? (() => { const s = new Set(基礎允許鍵快取); for (const k of overrideKeys) s.add(k); return s; })()
    : 基礎允許鍵快取;

  for (const [key, value] of Object.entries(parentLocalArgs)) {
    if (允許鍵.has(key)) {
      子資料[key] = value;
    }
  }

  // ② 合併子節點自帶的覆寫資料（同樣走白名單過濾）
  //    舊版只擋 父級隱私鍵，未擋 外貌傳播鍵，導致 className 等外貌鍵漏電至子層。
  //    新版全面走白名單，徹底封死此路徑。
  if (extraData && Object.keys(extraData).length > 0) {
    for (const [key, value] of Object.entries(extraData)) {
      if (允許鍵.has(key)) {
        子資料[key] = value;
      }
    }
  }

  return 子資料;
}

/**
 * 從子節點 JSON 提取非結構鍵的覆寫資料
 * @param childDef 子節點的原始 JSON 定義
 * @returns 清洗後的覆寫資料（原始值，不做插值 — 由下游 argsPipeline 統一處理）
 */
export function 提取子覆寫(
  childDef: Record<string, unknown>,
): Record<string, unknown> {
  const 原始覆寫: Record<string, unknown> = {};
  for (const k of Object.keys(childDef)) {
    if (!結構鍵.has(k.toLowerCase())) {
      // 🔴 不做智慧插值 — 模板解析全權交給 argsPipeline 集中處理
      原始覆寫[k] = childDef[k];
    }
  }
  return 原始覆寫;
}
