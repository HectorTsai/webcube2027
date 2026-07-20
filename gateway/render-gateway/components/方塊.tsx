// 方塊.tsx — 2026 終極職責分離 + 三波段平行加速版本
// 指揮官角色：不包含任何具體加工或業務特判，只按固定波段調度十條微型管線。
//
// 🏎️ 三波段執行流：
//   🌊 Wave 1（串行）：① chainPipeline → ② rbacPipeline → ③ apiPipeline → ④ rawParserPipeline
//   🌊 Wave 2（單獨）：⑤ argsPipeline（內含 defaults 合併 + 變體值傳播 + 集中化插值）
//   🌊 Wave 3（並行）：⑥ alpinePipeline ‖ ⑦ stylePipeline ‖ ⑧ renderPipeline ‖ ⑨ htmlPropsPipeline
//
// 管線清單（黃金 10 大管線）：
//   ① chainPipeline   → 沿 from 鏈路合併原型定義
//   ② rbacPipeline    → 角色權限控制熔斷站（目前全 Pass，未來根據登入角色隱藏方塊）
//   ③ apiPipeline     → 辨識 @api 異步請求並回填生數據
//   ④ rawParserPipeline → 拆解 HTML/SVG 字串，提取 attrs 降維 innerHTML
//   ⑤ argsPipeline    → 融合 defaults + userArgs → localArgs
//   ⑥ alpinePipeline  → Alpine 五態、互動、事件綁定
//   ⑦ stylePipeline   → className / style / styleConditions
//   ⑧ renderPipeline   → 子節點遞迴渲染、$$CHILDREN$$ 注入、repeat 展開
//   ⑨ htmlPropsPipeline → 僅映射合法 W3C HTML 原生屬性
import { jsx } from "hono/jsx/jsx-runtime";
import { raw } from "hono/html";
import { Context } from "hono";
import { 智慧插值 } from "../utils/安全過濾器.ts";
import { warn } from "../utils/logger.ts";
import { processChildren } from "./index.ts";
import type 方塊 from "../database/models/方塊.ts";

// ── 微型管線 ──
import { 解析定義鏈路, 載入方塊定義 } from "./pipelines/chainPipeline.ts";
import { rbacPipeline } from "./pipelines/rbacPipeline.ts";
import { 運行異步數據管線 } from "./pipelines/apiPipeline.ts";
import { 運行字串拆解管線 } from "./pipelines/rawParserPipeline.ts";
import { 建立子供電環境, type CubeEnv } from "./pipelines/argsPipeline.ts";
import { 運行互動狀態管線 } from "./pipelines/alpinePipeline.ts";
import { 運行樣式與條件管線 } from "./pipelines/stylePipeline.ts";
import { 處理子節點, 處理Repeat展開 } from "./pipelines/renderPipeline.ts";
import { 編譯純HTML屬性 } from "./pipelines/htmlPropsPipeline.ts";

export type { ArgDef } from "../database/models/方塊.ts";
export { 載入方塊定義 };

export interface CubeProps {
  definition?: Partial<方塊>;
  from?: string;
  args?: Record<string, unknown>;
  env?: CubeEnv;
  depth?: number;
  context?: Context;
  children?: unknown;
  tag?: string;
  [key: string]: unknown;
}

// ── Void 元素清單 ──
const VOID_ELEMENTS = new Set("input br hr img meta link area base col embed source track wbr".split(" "));

// ── SVG 核心外顯屬性：即使未在 definition.args 宣告，也應穿透至 userArgs ──
const SVG_外顯屬性 = new Set([
  "fill", "stroke", "strokeWidth", "strokeLinecap", "strokeLinejoin",
  "strokeDasharray", "strokeDashoffset", "strokeOpacity", "fillOpacity",
  "viewBox",
]);

// ── 🎯 主渲染引擎入口 ──
export default async function Cube(props: CubeProps): Promise<any> {
  const { context, tag: tagOverride } = props;
  const depth = props.depth ?? 0;

  let definition = props.definition as any;
  if (!definition && props.from && typeof props.from === "string") {
    definition = { from: props.from };
  }
  if (!definition) return "";

  // 遞迴深度防線
  if (depth > 10) return jsx("div", { class: "cube-error", children: "遞迴深度超過上限" });

  // ── 環境組裝 ──
  const currentEnv: CubeEnv = { ...(props.env || {}), currentYear: new Date().getFullYear() };
  if (!currentEnv.__cube_chain) currentEnv.__cube_chain = new Set();

  // ═══════════════════════════════════════════════════════
  // 🌊 Wave 1：原型與數據準備（串行依賴）
  // ═══════════════════════════════════════════════════════

  // ① chainPipeline：沿 from 鏈路合併原型定義
  let finalTag = tagOverride;
  if (definition.from && (definition.from as string).includes(":")) {
    const result = await 解析定義鏈路(definition.from, definition, context);
    if (typeof result === "string") {
      return jsx("div", { class: "cube-error", children: result });
    }
    definition = result.definition;
    finalTag = finalTag || result.resolvedTag;
  }

  if (!finalTag) {
    if (definition.tag) {
      finalTag = definition.tag;
    } else {
      return jsx("div", { class: "cube-error", children: `缺少 tag: ${definition.from || "(未知)"}` });
    }
  }

  if (typeof finalTag !== "string") {
    return jsx("div", { class: "cube-error", children: `Tag 類型錯誤: ${typeof finalTag}, value: ${JSON.stringify(finalTag)}, from: ${definition.from}` });
  }

  const lowerTag = finalTag.toLowerCase();

  // ── 使用者 args 過濾 ──
  const { definition: _d, from: _f, args: _a, depth: _dp, context: _c, children: _ch, env: _e, tag: _t, ...restArgs } = props;
  let userArgs: Record<string, unknown> = { ...(props.args || {}) };
  if (definition.args && Object.keys(definition.args).length > 0) {
    const allowedKeys = new Set(Object.keys(definition.args));
    for (const [key, val] of Object.entries(restArgs)) {
      if (allowedKeys.has(key)) {
        userArgs[key] = val;
      } else if (typeof key === "string" && (key.startsWith("x-") || key.startsWith("@") || key.startsWith(":") || SVG_外顯屬性.has(key))) {
        userArgs[key] = val;
      }
    }
  } else {
    userArgs = { ...userArgs, ...restArgs };
  }

  // 🔴 將 definition.defaults 合併進 userArgs（覆寫繼承來的 argDef.default）
  //    優先級：userArgs（外部傳入）> defaults（方塊自身覆寫）> argDef.default（繼承的預設值）
  //    ⚠️ 此合併非多餘：argsPipeline 只處理 argDef.default，不處理 definition.defaults，
  //       因此 definition.defaults 必須在此處注入 userArgs，才能隨 Object.assign 進入 localArgs。
  if (definition.defaults) {
    for (const [k, v] of Object.entries(definition.defaults as Record<string, unknown>)) {
      if (userArgs[k] === undefined) {
        userArgs[k] = v;
      }
    }
  }

  // ② rbacPipeline：角色權限控制熔斷站（目前全 Pass）
  //    未來啟用時，權限不足會返回 { definition: { __melted: true }, args: {} }
  ({ definition, args: userArgs } = await rbacPipeline(definition, userArgs, context));

  // 🛡️ RBAC 熔斷守衛：檢測 __melted 標記，直接終止渲染
  //    不讓 definition/args 流入後續管線，杜絕敏感資料透過任何標籤（含 <template>）洩漏至 HTML
  if (definition.__melted) return "";

  // ③ apiPipeline：@api 異步數據請求（權限通過後才撈 API，省效能）
  //    優先級鏈：argDef.default（基底）→ definition.defaults（方塊自身覆寫）→ userArgs（外部傳入，最高）
  let earlyArgs: Record<string, unknown> = { currentYear: currentEnv.currentYear as number };
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
      if (argDef.default !== undefined) earlyArgs[key] = argDef.default;
    }
  }
  if (definition.defaults) {
    Object.assign(earlyArgs, definition.defaults);
  }
  Object.assign(earlyArgs, userArgs);
  const apiData = await 運行異步數據管線(definition, earlyArgs, context);

  // ④ rawParserPipeline：拆解 HTML/SVG 字串
  if (apiData && Object.keys(apiData).length > 0) {
    Object.assign(earlyArgs, apiData);
  }
  const rawResult = 運行字串拆解管線(definition, earlyArgs);

  // ═══════════════════════════════════════════════════════
  // 🌊 Wave 2：區域供電站（產出 localArgs，所有後續管線的燃料）
  // ═══════════════════════════════════════════════════════

  // ④ argsPipeline：融合 defaults + userArgs + env
  const { localArgs, nextEnv } = await 建立子供電環境(definition, userArgs, currentEnv, context, apiData);
  // 追蹤合併 mergedArgs 解析後的 key（自身 + 繼承自父層），防止洩漏為 HTML 屬性
  const 父層合併鍵: Set<string> = userArgs._mergedArgKeys instanceof Set ? userArgs._mergedArgKeys : new Set();
  if (definition.mergedArgs) {
    for (const k of Object.keys(definition.mergedArgs)) 父層合併鍵.add(k);
  }
  if (父層合併鍵.size > 0) localArgs._mergedArgKeys = 父層合併鍵;
  if (localArgs.color && localArgs.color !== "current") nextEnv.color = String(localArgs.color);

  // 五態分類：將 active/hover/focus/selected/disabled/activeStateName 分類為
  // "static"（純靜態 Boolean）或 "dynamic"（Alpine 表達式字串），供後續管線共用
  localArgs._五態分類 = {};
  const 五態鍵 = ["active", "hover", "focus", "selected", "disabled", "activeStateName"];
  for (const k of 五態鍵) {
    const v = (localArgs as Record<string, unknown>)[k];
    if (v === undefined || v === null) continue;
    (localArgs as any)._五態分類[k] = typeof v === "string" && (v.includes("$") || v.includes(".")) ? "dynamic" : "static";
  }

  // Phase 1 變體傳播已移入 argsPipeline.ts（步驟 4.5），確保 variant 非標準鍵在集中化插值前寫入 localArgs

  // ── rawParser 結果處理：僅 SVG 相關標籤且有 rawContent 且無外部 children 時才走快速路徑 ──
  //    非 SVG 標籤（如 div、button）必須走完整 Wave 3 以獲得 stylePipeline 的主題樣式。
  const isSvgOrRawTag = lowerTag === "svg" || lowerTag === "path";
  if (isSvgOrRawTag && rawResult.rawContent !== null && !props.children) {
    const { extractedAttrs, rawContent } = rawResult;

    // 計算 variant className（此為 raw 快速路徑，無需跑完整 stylePipeline）
    let rawClass = (localArgs.className as string) || definition.className || "";
    if (definition.args) {
      for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
        const runtimeVal = localArgs[key];
        if (runtimeVal === undefined) continue;
        const v = argDef.variants?.[String(runtimeVal)];
        if (v?.className) rawClass = [rawClass, v.className].filter(Boolean).join(" ");
      }
    }
    if (localArgs.color) rawClass = `${rawClass} cube-color-${localArgs.color}`.trim();

    const attrsStr = [
      ...Object.entries(extractedAttrs).map(([k, v]) => `${k}="${v}"`),
      rawClass ? `class="${rawClass}"` : "",
    ].filter(Boolean).join(" ");

    return raw(`<${definition.tag} ${attrsStr}>${rawContent}</${definition.tag}>`);
  }

  // 🔁 Repeat 展開（必須在 Wave 3 管線之前執行）
  //    管線（特別是 renderPipeline）會用 localArgs 渲染子節點，
  //    若先跑管線再展開 repeat，子節點會拿到不含 item 的錯誤 localArgs，
  //    導致 items 陣列／name 物件洩漏至 Hono 渲染層引發 .toString() 崩潰。
  if (definition.repeat) return 處理Repeat展開(definition, localArgs, nextEnv, context, depth);

  // ═══════════════════════════════════════════════════════
  // 🌊 Wave 3：四大管線並行炸開（Promise.all）
  //            alpines / 樣式 / 結構 / HTML屬性 彼此無依賴，同時開工！
  // ═══════════════════════════════════════════════════════
  const [alpineProps, styleProps, childResult, htmlAttrs] = await Promise.all([
    運行互動狀態管線(definition, localArgs),
    運行樣式與條件管線(definition, localArgs, nextEnv.color as string | undefined),
    // 🔧 暫時停用快速通道以診斷 children 渲染問題
    /* (props.children && typeof props.children === "object" && !Array.isArray(props.children) && !("from" in (props.children as any)) && typeof (props.children as any).tag === "string")
      ? Promise.resolve({ 最終子節點: props.children })
      : */ 處理子節點(definition, props.children, localArgs, nextEnv, context, depth),
    編譯純HTML屬性(definition, localArgs),
  ]);

  const { 最終子節點 } = childResult;

  // 合併 stylePipeline 產出的動態 Alpine :class（來自 styleConditions 未解析變數）
  const 合併AlpineProps = { ...alpineProps, ...(styleProps.alpineAttrs || {}) };

  // 五態穿透（直接使用 Wave 2 產生的 nextEnv，無需等待 childResult 回傳）
  nextEnv.parentHover = localArgs.hover || nextEnv.parentHover || false;
  nextEnv.parentActive = localArgs.disabled ? false : (localArgs.active ?? nextEnv.parentActive ?? true);

  // ── Disabled / 斷電 ──
  if (localArgs.disabled || localArgs.active === false) {
    styleProps.className = `${styleProps.className || ""} !cursor-not-allowed`.trim();
    htmlAttrs["aria-disabled"] = "true";
    if (["button", "input", "select", "textarea"].includes(lowerTag)) {
      htmlAttrs.disabled = true;
    }
    delete htmlAttrs.onclick;
    delete htmlAttrs["@click"];
    delete htmlAttrs["x-on:click"];
  }

  // ── Alpine disabled 聯動 ──
  // alpinePipeline 已負責檢測 localArgs 中的 x-bind:disabled/:disabled，並動態更新 data-active/data-hover

  // Void 元素
  if (VOID_ELEMENTS.has(lowerTag)) {
    return jsx(finalTag!, { class: styleProps.className, style: styleProps.style, ...htmlAttrs, ...合併AlpineProps });
  }

  // ── Children 組裝 ──
  const hasChildren = 最終子節點 !== undefined && (!Array.isArray(最終子節點) || 最終子節點.length > 0);
  const hasText = definition.text !== undefined;

  let flatChildren: any[] = [];
  if (hasChildren) {
    // 🚀 原生 JSX VNode 檢測：若是外部傳入的靜態 JSX，跳過 processChildren 的 JSON 解析
    const 是原生JSX = typeof 最終子節點 === "object" && 最終子節點 !== null && !Array.isArray(最終子節點) && !("from" in 最終子節點);
    const poweredChildren = 是原生JSX
      ? 最終子節點
      : processChildren(最終子節點, { ...localArgs, context });
    flatChildren = [poweredChildren].flat().filter(Boolean);
  }

  const nativeChildren = flatChildren.filter(
    (n) => n !== null && n !== undefined && n !== false,
  );

  // 萬物皆空防線
  if (nativeChildren.length === 0 && !hasText) {
    if (!styleProps.className && Object.keys(styleProps.style || {}).length === 0 && !styleProps.alpineAttrs) return "";
    return jsx(finalTag!, { class: styleProps.className, style: styleProps.style, ...htmlAttrs, ...合併AlpineProps });
  }

  return jsx(finalTag!, {
    class: styleProps.className,
    style: styleProps.style,
    ...htmlAttrs,
    ...合併AlpineProps,
    children: (() => {
      const parts: any[] = [];
      if (hasText) parts.push(智慧插值(definition.text, localArgs));
      if (nativeChildren.length > 0) parts.push(...nativeChildren);
      if (parts.length === 0) return undefined;
      // ⚠️ Hono 渲染器在處理陣列中的 VNode 子節點時會將其丟失，
      //    單一 VNode 必須直接傳遞（不包裝在陣列中）才能正確渲染
      return parts.length === 1 ? parts[0] : parts;
    })(),
  });
}
