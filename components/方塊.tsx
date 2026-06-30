// 方塊.tsx (2026 統一方塊渲染器 — Headless 重構版)
// 接收 方塊定義 JSON（或 from 從 DB 載入），渲染出單一原生 HTML 節點。
import { processChildren } from "./index.ts";
import { jsx } from "hono/jsx/jsx-runtime";
import { raw } from "hono/utils/html";

import { Children } from "hono/jsx";
import { Context } from "hono";
import { InnerAPI } from "../services/index.ts";
import { 驗證完整性, 安全過濾Cube, substitute } from "../utils/安全過濾器.ts";
import { warn } from "../utils/logger.ts";
import 方塊 from "../database/models/方塊.ts";
import 圖示 from "./圖示.tsx";
import 圖片 from "./圖片.tsx";
import Slot from "./Slot.tsx";

/** styleConditions CSS 作用域計數器，確保不同實例的 <style> 不會互相污染 */
let styleScopeId = 0;

// ---------- 全域 fallback 註冊表 ----------
const fallbackRegistry: Record<string, FallbackComponent> = {};

export function registerFallback(id: string, component: FallbackComponent): void {
  fallbackRegistry[id] = component;
}

registerFallback("方塊:方塊:圖示", (props: Record<string, unknown>) => 圖示(props));
registerFallback("方塊:方塊:圖片", (props: Record<string, unknown>) => 圖片(props));

// 🛡️ 容器 Fallback：場景分流 — 繼承鏈攔截透傳 tag，直接調用放行 DB
registerFallback("方塊:方塊:容器", (props: Record<string, unknown>) => {
  const c = props.context as Context | undefined;
  if (!c) return jsx("div", { class: "cube-fallback-error" });

  const definition = props.definition as any;
  const currentTag = definition?.tag;

  // 🛡️ 場景分流斷路器：無上層 tag 需透傳（容器被直接調用）→ 放行給主流程 DB 載入
  if (!currentTag) return null;

  // 繼承鏈場景（如 超連結 → 容器）：透傳 tag 給容器層
  const { from: _f, ...restProps } = props as Record<string, unknown> & { from?: string };
  const cleanDef = { ...definition, from: "div" };
  return jsx(Cube, { definition: cleanDef, tag: currentTag, ...restProps });
});

// 型別從 database/models/方塊.ts 統一匯出
export type { ArgDef } from "../database/models/方塊.ts";

// ---------- 原生 HTML 元素查表 ----------
const VOID_ELEMENTS = new Set([
  "input", "br", "hr", "img", "meta", "link", "area", "base",
  "col", "embed", "source", "track", "wbr",
]);

const TAG_ATTR_WHITELIST: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "download", "hreflang", "ping", "referrerpolicy",]),
  img: new Set(["src", "alt", "crossorigin", "decoding", "loading", "referrerpolicy", "sizes", "srcset"]),
  input: new Set(["type", "placeholder", "value", "name", "readonly", "required", "min", "max", "step", "maxlength", "pattern", "autocomplete", "autofocus"]),
  button: new Set(["type", "name", "value", "autofocus"]),
  form: new Set(["action", "method", "target", "enctype", "novalidate", "autocomplete"]),
  label: new Set(["for"]),
  textarea: new Set(["placeholder", "rows", "cols", "maxlength", "readonly"]),
  select: new Set(["multiple", "name", "required"]),
  video: new Set(["src", "poster", "controls", "autoplay", "loop", "muted", "width", "height"]),
  audio: new Set(["src", "controls", "autoplay", "loop", "muted"]),
};

const GLOBAL_ATTRS = new Set(["id", "title", "tabindex", "role", "aria-label", "aria-hidden", "lang", "dir", "hidden", "disabled"]);

// 斷電時需移除的原生互動屬性（防止瀏覽器忽略 disabled 仍觸發行為）
const 原生點擊屬性 = ["href", "action", "formaction"];

function isAttrAllowed(tag: string, attr: string): boolean {
  const attrLower = attr.toLowerCase();
  if (GLOBAL_ATTRS.has(attrLower) || attrLower.startsWith("aria-")) return true;
  const allowed = TAG_ATTR_WHITELIST[tag.toLowerCase()];
  if (allowed) return allowed.has(attrLower);
  return false;
}


const CUBE_META = new Set([
  ...Object.keys(new 方塊().toJSON()),
  "shareChildren", "comment", "if", "__editor",
]);

function isVoidElement(tag: string): boolean {
  return VOID_ELEMENTS.has(tag.toLowerCase());
}

// ── $api 語法解析器 ──
// 支持在 JSON 中使用 { "$api": { "path": "/api/v1/info", "field": "商標" } }
// 或簡寫 { "$api": "商標" }（預設 path 為 /api/v1/info）
// args 參數用於 {variable} 插值：field/path 中的 {item} 會被替換為 args.item
async function resolveApiReferences(
  obj: unknown,
  context: Context | undefined,
  args?: Record<string, unknown>
): Promise<unknown> {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => resolveApiReferences(item, context, args)));
  }

  const objRecord = obj as Record<string, unknown>;

  // 如果這是一個 $api 物件（只有 $api 屬性），直接解析
  if ('$api' in objRecord && Object.keys(objRecord).length === 1) {
    const apiConfig = objRecord.$api;
    const rawPath = typeof apiConfig === 'string' ? '/api/v1/info' : (apiConfig as Record<string, unknown>).path as string || '/api/v1/info';
    const rawField = typeof apiConfig === 'string' ? apiConfig : (apiConfig as Record<string, unknown>).field as string;

    const path = args ? substitute(rawPath, args) : rawPath;
    const field = args ? substitute(rawField, args) : rawField;

    if (context && field) {
      try {
        const response = await InnerAPI(context, path);
        const data = await response.json() as any;
        if (data.success && data.data) {
          const fieldParts = field.split('.');
          let current: any = data.data;
          for (const part of fieldParts) {
            current = current?.[part];
            if (current === undefined) break;
          }
          return current;
        }
      } catch {
        if (args && args.item !== undefined) return String(args.item);
        return obj;
      }
    }
    if (args && args.item !== undefined) return String(args.item);
    return obj;
  }

  // 否則遞歸處理物件的屬性
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(objRecord)) {
    result[key] = await resolveApiReferences(value, context, args);
  }
  return result;
}

export type FallbackComponent = (props: Record<string, unknown>) => any;

export interface CubeProps {
  definition?: Partial<方塊>;
  from?: string;
  args?: Record<string, unknown>;
  depth?: number;
  context?: Context;
  fallbacks?: Record<string, FallbackComponent>;
  children?: unknown;
  slots?: Record<string, unknown>;
  [key: string]: unknown;
}

// ── 🎯 從 DB 載入方塊定義（走 InnerAPI） ──
export async function 載入方塊定義(cubeId: string, c: Context): Promise<Partial<方塊> | null> {
  try {
    const response = await InnerAPI(c, `/api/v1/cube/${cubeId}`);
    const result = await response.json();
    if (result.success && result.data) {
      const 已檢驗 = result.data.已檢驗 as string;
      if (已檢驗) {
        const 待驗證內容 = { from: result.data.from, className: result.data.className, style: result.data.style, args: result.data.args, children: result.data.children, on: result.data.on };
        const 通過 = await 驗證完整性(待驗證內容, 已檢驗);
        if (!通過) {
          result.data = 安全過濾Cube(result.data);
        }
      } else {
        result.data = 安全過濾Cube(result.data);
      }
      return new 方塊(result.data) as Partial<方塊>;
    }
  } catch {
    // 失敗保護
  }
  return null;
}

// 解析 mergedArgs 定義中的 @api/... 規格
async function resolveMergedArgsDef(
  mergedArgsDef: Record<string, string>,
  context: Context,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(mergedArgsDef)) {
    if (spec.startsWith('@api/')) {
      const apiPath = spec.replace('@api/', '/api/');
      try {
        const response = await InnerAPI(context, apiPath);
        const data = await response.json() as any;
        resolved[key] = data.success ? data.data : undefined;
      } catch {
        resolved[key] = undefined;
      }
    }
  }
  return resolved;
}

// ── 🎯 解析最終屬性與樣式：將散落的 Alpine / On / Data / 屬性過濾 / 供電邏輯統一抽離 ──
function 解析最終屬性與樣式(params: {
  tag: string;
  definition: Partial<方塊>;
  mergedArgs: Record<string, unknown>;
  finalOn: Record<string, string>;
  finalData: Record<string, string>;
  finalStyle: Record<string, string>;
  finalClassName: string;
  variantAlpine?: Record<string, unknown>;
}) {
  const { tag, definition, mergedArgs, finalOn, finalData, finalStyle, finalClassName, variantAlpine } = params;
  const attrs: Record<string, any> = {};

  // 1. 合併 & 解析 Alpine
  const effectiveAlpine = variantAlpine
    ? {
        ...definition.alpine,
        ...variantAlpine,
        attrs: { ...(definition.alpine?.attrs as Record<string, string> || {}), ...(variantAlpine.attrs as Record<string, string> || {}) },
      }
    : definition.alpine;
  if (effectiveAlpine) {
    const bind = effectiveAlpine.bind as Record<string, string> | undefined;
    if (bind) { for (const [k, v] of Object.entries(bind)) attrs[`x-bind:${k}`] = substitute(v, mergedArgs); }
    const a = effectiveAlpine.attrs as Record<string, string> | undefined;
    if (a) { for (const [k, v] of Object.entries(a)) attrs[k.startsWith("x-") ? k : `x-${k}`] = substitute(v, mergedArgs); }
    if (effectiveAlpine.init) attrs["x-init"] = substitute(effectiveAlpine.init as string, mergedArgs);
    if (effectiveAlpine.model) attrs["x-model"] = substitute(effectiveAlpine.model as string, mergedArgs);
  }

  // 2. 合併 & 解析 On 監聽器與 Data 屬性
  for (const [k, v] of Object.entries(finalOn)) attrs[`x-on:${k}`] = substitute(v, mergedArgs);
  for (const [k, v] of Object.entries(finalData)) attrs[`data-${k}`] = substitute(v, mergedArgs);

  // 3. 核心屬性白名單過濾 & 解析（加入 color / text 防止洩漏成 HTML attribute）
  const NATIVE_RESERVED = new Set(['className','style','context','children','definition','from','args','depth','fallbacks','slots','color','text']);
  for (const [k, v] of Object.entries(mergedArgs)) {
    if (typeof k !== 'string') continue;
    // Alpine 指令穿透：JSX props 中的 x-* / @* 若未被 definition 處理過，直接注入 attrs
    if (k.startsWith("x-") || k.startsWith("@")) {
      if (!(k in attrs) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
        attrs[k] = substitute(String(v), mergedArgs);
      }
      continue;
    }
    if (k.startsWith("data-") || NATIVE_RESERVED.has(k) || (k in attrs)) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      if (isAttrAllowed(tag, k)) attrs[k] = substitute(String(v), mergedArgs);
    }
  }

  // 4. 準備最終 Style（不再手動注入 --c-current，交由 UnoCSS 的 cube-color-{color} 處理）
  const 最終Style: Record<string, string> = { ...finalStyle };

  // 5. 準備最終 ClassName：合併 seed 定義、外部傳入、color 供電
  const 最終ClsArray: string[] = [];
  const 清理後的FinalCls = finalClassName.trim();
  if (清理後的FinalCls) 最終ClsArray.push(清理後的FinalCls);
  if (mergedArgs.className && typeof mergedArgs.className === 'string') {
    最終ClsArray.push(substitute(mergedArgs.className, mergedArgs));
  }
  if (mergedArgs.color) {
    最終ClsArray.push(`cube-color-${mergedArgs.color}`);
  }

  return { attrs, 最終Style, 最終ClassName: 最終ClsArray.join(" ") };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Headless 重構：新增輔助函數
// ═══════════════════════════════════════════════════════════════════════════

// ── 準備核心Args：整合 $api 解析、@api 共享變數、slot 提取 ──
async function 準備核心Args(props: Record<string, unknown>, context: Context | undefined) {
  let def = props.definition as Partial<方塊> | undefined;

  // 🔧 外層直接呼叫 <Cube from="..." /> 時，from 是頂層 prop 而非 definition.from
  // 在此補建最小定義，避免 Cube 提早 return null 導致 Hono HTML 序列化器崩潰
  // 無論是 DB 引用（含 ":"）或原生 HTML 標籤（"div"/"span"），都需要建立最小定義
  if (!def && props.from && typeof props.from === "string") {
    def = { from: props.from as string };
  }

  if (!def) return { definition: undefined, mergedArgs: {} as Record<string, unknown>, childrenProp: undefined };

  const mergedArgs: Record<string, unknown> = {};

  // 1. 套用 args 預設值
  if (def.args) {
    for (const [key, argDef] of Object.entries(def.args)) {
      if (argDef.default !== undefined) mergedArgs[key] = argDef.default;
    }
  }

  // 2. 全域變數
  mergedArgs.currentYear = new Date().getFullYear();

  // 3. 合併 runtime args
  Object.assign(mergedArgs, props.args as Record<string, unknown> || {});

  // 4. 解析 $api 引用（definition.children / definition.slots）
  if (context) {
    if (def.children) {
      def.children = await resolveApiReferences(def.children, context) as any[];
    }
    if (def.slots) {
      def.slots = await resolveApiReferences(def.slots, context) as Record<string, any>;
    }
    // 解析 @api/... 共享變數
    if (def.mergedArgs) {
      const apiResolved = await resolveMergedArgsDef(def.mergedArgs, context);
      Object.assign(mergedArgs, apiResolved);
    }
  }

  // 5. 合併 rest args
  const { definition: _d, from: _f, args: _a, depth: _dp, context: _c, fallbacks: _fb, slots: _s, children: _ch, ...restArgs } = props;
  Object.assign(mergedArgs, restArgs);

  // 6. defaults 最後套用，鎖定內部參數不受外部覆蓋
  if (def.defaults && def.args) {
    const 重疊keys = Object.keys(def.defaults).filter(k => k in def.args!);
    if (重疊keys.length > 0) {
      await warn('Cube', `方塊「${def.from || '(未知)'}」的 defaults 與 args key 重疊：${重疊keys.join(', ')}。defaults 將勝出。`);
    }
  }
  Object.assign(mergedArgs, def.defaults ?? {});

  // 7. Slot 提取：從 JSX children 中分離出 Slot 節點
  const jsxChildren = props.children;
  let effectiveJsxChildren = jsxChildren;
  const effectiveExtSlots: Record<string, unknown> = {};

  if (jsxChildren !== undefined) {
    const rawChildren = Array.isArray(jsxChildren) ? jsxChildren : [jsxChildren];
    const regularChildren: unknown[] = [];
    for (const child of rawChildren) {
      const node = child as any;
      if (node && typeof node === 'object' && (node.type === Slot || node.tag === Slot)) {
        const slotName = node.props?.name || '';
        effectiveExtSlots[slotName] = node.props?.children ?? node.children;
        continue;
      }
      if (typeof node === 'object' && node !== null && node.tag === 'slot') {
        regularChildren.push(child);
        continue;
      }
      regularChildren.push(child);
    }
    effectiveJsxChildren = regularChildren.length === 1 ? regularChildren[0] : regularChildren;
  }

  // 8. 處理 slots 定義：將外部 slot 內容與預設 children 合併
  let childrenProp: unknown = effectiveJsxChildren;
  if (def.slots) {
    const slotNodes: unknown[] = [];
    let jsxChildrenConsumed = false;
    for (const [slotName, slotDef] of Object.entries(def.slots)) {
      const slotArgOverrides: Record<string, unknown> = {};
      const sd = slotDef as Record<string, unknown>;
      for (const [k, v] of Object.entries(sd)) {
        if (!CUBE_META.has(k) && v !== undefined) {
          slotArgOverrides[k] = typeof v === "string" ? substitute(v as string, mergedArgs) : v;
        }
      }
      const childArgs = Object.keys(slotArgOverrides).length ? { ...mergedArgs, ...slotArgOverrides } : mergedArgs;
      let slotContent = effectiveExtSlots[slotName];
      if (!slotContent && !jsxChildrenConsumed && effectiveJsxChildren !== undefined) {
        if (slotName === "body" || slotName === "content") {
          slotContent = effectiveJsxChildren;
          jsxChildrenConsumed = true;
        }
      }
      if (!slotContent && effectiveJsxChildren !== undefined && sd.shareChildren) {
        slotContent = effectiveJsxChildren;
      }
      if (slotContent === undefined) {
        const { children: slotOwnChildren, ...sdRest } = sd;
        if (!sd.from || (sd.from === "div" && !sd.className && !sd.alpine && !sd.on)) {
          if (!slotOwnChildren) continue;
          slotNodes.push(jsx(Cube, { definition: { children: slotOwnChildren } as Partial<方塊>, args: childArgs, depth: 1, context }));
          continue;
        }
        if (slotOwnChildren) {
          slotNodes.push(jsx(Cube, { definition: sdRest as Partial<方塊>, args: childArgs, depth: 1, context, children: jsx(Cube, { definition: { children: slotOwnChildren } as Partial<方塊>, args: childArgs, depth: 2, context }) }));
        } else {
          slotNodes.push(jsx(Cube, { definition: sdRest as Partial<方塊>, args: childArgs, depth: 1, context }));
        }
        continue;
      }
      const contentArray = Array.isArray(slotContent) ? slotContent : [slotContent];
      slotNodes.push(jsx(Cube, { definition: slotDef as Partial<方塊>, args: childArgs, depth: 1, context, children: contentArray }));
    }
    if (!jsxChildrenConsumed && effectiveJsxChildren !== undefined) {
      slotNodes.push(...(Children.toArray(effectiveJsxChildren as any) as unknown[]).flat(Infinity));
    }
    // 渲染頂層 children
    if (def.children) {
      slotNodes.push(jsx(Cube, { definition: { children: def.children } as Partial<方塊>, args: mergedArgs, depth: 1, context }));
    }
    childrenProp = slotNodes.length === 1 ? slotNodes[0] : slotNodes;
  } else if (effectiveJsxChildren !== undefined) {
    childrenProp = (Children.toArray(effectiveJsxChildren as any) as unknown[]).flat(Infinity);
    if (Array.isArray(childrenProp) && childrenProp.length === 1) childrenProp = childrenProp[0];
  }

  return { definition: def, mergedArgs, childrenProp };
}

// ── 處理Repeat展開：非同步陣列展開 + context 接力 ──
async function 處理Repeat展開(definition: any, mergedArgs: any, childrenProp: any, context: any) {
  const repeatConfig = definition.repeat;
  const dataKey = typeof repeatConfig === "string" ? repeatConfig : repeatConfig.data;
  const repeatData = mergedArgs[dataKey] || (Array.isArray(dataKey) ? dataKey : []);

  if (!Array.isArray(repeatData)) {
    return jsx("div", { class: "cube-error", children: `Repeat 資料源非陣列: ${dataKey}` });
  }

  const nextDef = { ...definition };
  delete nextDef.repeat;

  const renderedNodes = await Promise.all(
    repeatData.map(async (item: any, index: number) => {
      const itemArgs = {
        ...mergedArgs,
        item: item,
        index: index,
        ...(typeof item === "object" ? item : {})
      };
      return jsx(Cube, { definition: nextDef, context, ...itemArgs, children: childrenProp });
    })
  );

  return renderedNodes;
}

// ── 處理方塊引用：fallback 查找 → DB 載入 → 定義合併 → 遞迴 ──
async function 處理方塊引用(from: string, currentDef: any, mergedArgs: any, childrenProp: any, context: any) {
  // 0. 🛡️ 循環引用防護網：偵測渲染鏈上的重複方塊 ID，防止 A→B→A 無窮遞迴
  const chain: Set<string> = mergedArgs.__cube_chain || new Set<string>();
  if (chain.has(from)) {
    const path = [...chain, from].join(" → ");
    return jsx("div", {
      class: "cube-error",
      children: `循環引用: ${path}`,
    });
  }
  chain.add(from);
  mergedArgs.__cube_chain = chain;

  // 1. 回溯 fallback 註冊表
  if (fallbackRegistry[from]) {
    const result = await fallbackRegistry[from]({ ...mergedArgs, context, children: childrenProp });
    // 🌟 若 Fallback 回傳 null 表示不攔截，放行給 DB 載入流程
    if (result !== null && result !== undefined) {
      chain.delete(from);
      return result;
    }
  }

  // 2. 從 DB 載入父級定義
  if (!context) {
    chain.delete(from);
    return jsx("div", { class: "cube-error", children: `缺少 context，無法載入方塊: ${from}` });
  }
  const parentDef = await 載入方塊定義(from, context);
  if (!parentDef) {
    chain.delete(from);
    return jsx("div", { class: "cube-error", children: `未知方塊引用: ${from}` });
  }

  // 3. 定義合併：父級為底，當前層級覆蓋
  const 合併後的定義 = {
    ...parentDef,
    ...currentDef,
    className: `${parentDef.className || ""} ${currentDef.className || ""}`.trim(),
    args: { ...(parentDef.args || {}), ...(currentDef.args || {}) },
    wrap: currentDef.wrap || parentDef.wrap,
    on: { ...(parentDef.on || {}), ...(currentDef.on || {}) },
    data: { ...(parentDef.data || {}), ...(currentDef.data || {}) },
    style: { ...(parentDef.style || {}), ...(currentDef.style || {}) },
    alpine: parentDef.alpine || currentDef.alpine
      ? {
          ...(parentDef.alpine || {}),
          ...(currentDef.alpine || {}),
          attrs: { ...((parentDef.alpine as any)?.attrs || {}), ...((currentDef.alpine as any)?.attrs || {}) },
        }
      : undefined,
    // 🔥 關鍵：from 必須跟隨父定義的繼承鏈往下走
    // currentDef.from 是外層入口的 from（如 "方塊:方塊:超連結"），不可蓋回
    // 必須用 parentDef.from（如 "方塊:方塊:容器"）才算繼續往下繼承，否則形成無窮迴圈 → OOM
    from: parentDef.from || currentDef.from || "div",
  };

  // 4. 遞迴呼叫 Cube，確保 context 持續向下傳遞
  const result = await jsx(Cube, { definition: 合併後的定義, context, ...mergedArgs, children: childrenProp });
  chain.delete(from);
  return result;
}

// ── 解析智慧五態Alpine：自動判別靜態 Boolean、Alpine 表達式與 activeStateName ──
function 解析智慧五態Alpine(mergedArgs: any) {
  // 🔒 disabled 強制斷電：無論 active/hover 傳入何值，disabled=true 一律關閉通電與懸停
  const disabled = String(mergedArgs.disabled) === 'true';
  const active = disabled ? false : (mergedArgs.active ?? true);
  const hover = disabled ? false : (mergedArgs.hover ?? false);
  const focus = disabled ? false : (mergedArgs.focus ?? true);
  const selected = mergedArgs.selected ?? false;
  const activeStateName = mergedArgs.activeStateName as string | undefined;

  const isAlpineExpression = (val: any) => typeof val === 'string' && (val.includes('$') || val.includes('.'));

  const alpineAttrs: Record<string, string> = {};

  // 1. 🛡️ activeStateName 動態綁定：生成 Alpine 響應式 data-active + x-init + x-bind:style
  if (activeStateName && activeStateName.trim() !== "") {
    const cleanState = activeStateName.trim();

    // 自動判別：若已是完整 Alpine 路徑（含 $ 或 .），直接使用；否則前綴 $store.Container
    const statePath = isAlpineExpression(cleanState) ? cleanState : `$store.Container.${cleanState}`;

    // x-bind:data-active：動態切換，含 ?. + ?? fallback 到預設值
    alpineAttrs["x-bind:data-active"] = `(${statePath} ?? ${active}) ? 'true' : 'false'`;

    // x-bind:style：斷電時切換為 neutral 色
    alpineAttrs["x-bind:style"] = `!(${statePath} ?? ${active}) ? '--c-current: var(--color-neutral-raw); --c-current-content: var(--color-neutral-content-raw);' : ''`;

    // x-init：防呆初始化 Alpine store
    alpineAttrs["x-init"] = `if(!Alpine.store('Container')){Alpine.store('Container',{})}if(Alpine.store('Container').${cleanState}===undefined){Alpine.store('Container').${cleanState}=${active}}`;
  } else {
    // 2. 傳統靜態或 Alpine 表達式場景
    if (isAlpineExpression(active)) {
      alpineAttrs[":data-active"] = String(active);
    } else {
      alpineAttrs["data-active"] = String(active);
    }
  }

  // 3. hover 狀態綁定（維持原邏輯）
  if (isAlpineExpression(hover)) {
    alpineAttrs[":data-hover"] = String(hover);
  } else {
    alpineAttrs["data-hover"] = String(hover);
  }

  // 4. selected 狀態綁定（第四態）
  if (isAlpineExpression(selected)) {
    alpineAttrs[":data-selected"] = String(selected);
  } else {
    alpineAttrs["data-selected"] = String(selected);
  }

  // 5. focus 狀態綁定（第五態：鍵盤焦點）
  if (isAlpineExpression(focus)) {
    alpineAttrs[":data-focus"] = String(focus);
  } else {
    alpineAttrs["data-focus"] = String(focus);
  }

  return alpineAttrs;
}

// ── 處理StyleConditions：條件 CSS 注入（使用 Hono html 模板） ──
function 處理StyleConditions(styleConditions: any, mergedArgs: any) {
  let cssText = "";
  const scopeClass = `cube-scope-${++styleScopeId}`;

  Object.entries(styleConditions).forEach(([key, cssTemplate]) => {
    if (mergedArgs[key] === true) {
      cssText += (cssTemplate as string).replace(/&/g, `.${scopeClass}`);
    }
  });

  if (!cssText) return { scopeClass: "", styleNode: null };

  const styleNode = jsx("style", { children: raw(cssText) } as Record<string, unknown>);
  return { scopeClass, styleNode };
}

// ── 剝離HTML污染屬性：整合變體處理、屬性過濾、供電注入 ──
function 剝離HTML污染屬性(
  tag: string,
  definition: any,
  mergedArgs: any,
  variantAlpine: any,
  條件ScopeClass: string = "",
) {
  // 1. 處理 variant 變體
  let finalClassName = definition.className || "";
  const finalStyle: Record<string, string> = { ...definition.style };
  const finalOn: Record<string, string> = { ...definition.on };
  const finalData: Record<string, string> = { ...definition.data };
  let mergedAlpine = variantAlpine ? { ...variantAlpine } : undefined;

  if (definition.args) {
    // 🔄 兩階段變體處理：避免 variant 傳播值（如 size→padding）在目標 arg 處理完後才寫入
    const 變體標準Key = ['className', 'style', 'on', 'data', 'alpine', 'containerClassName', 'wrapClassName'];

    // ═══ Pass 1：只處理非標準 key 的傳播，確保下游 args 在 Pass 2 看到最新值 ═══
    for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
      const runtimeVal = mergedArgs[key];
      if (runtimeVal !== undefined && argDef.variants) {
        const v = argDef.variants[String(runtimeVal)];
        if (v) {
          for (const [vk, vv] of Object.entries(v)) {
            if (!變體標準Key.includes(vk)) {
              mergedArgs[vk] = vv;
            }
          }
        }
      }
    }

    // ═══ Pass 2：標準 key 套用（此時 mergedArgs 已含 Pass 1 傳播的最新值） ═══
    for (const [key, argDef] of Object.entries(definition.args) as [string, any][]) {
      const runtimeVal = mergedArgs[key];
      if (runtimeVal !== undefined && argDef.variants) {
        const v = argDef.variants[String(runtimeVal)];
        if (v) {
          if (v.className) finalClassName = [finalClassName, v.className].filter(Boolean).join(" ");
          if (v.style) Object.assign(finalStyle, v.style);
          if (v.on) Object.assign(finalOn, v.on);
          if (v.data) Object.assign(finalData, v.data);
          if (v.alpine) {
            if (!mergedAlpine) mergedAlpine = {};
            for (const [ak, av] of Object.entries(v.alpine)) {
              if (ak === "attrs" && av && (mergedAlpine as any).attrs) {
                Object.assign((mergedAlpine as any).attrs, av as Record<string, unknown>);
              } else {
                (mergedAlpine as any)[ak] = av;
              }
            }
          }
        }
      }
    }
  }

  // 1.5 無 variant 的 CSS 維度屬性直接注入（width / height / min-* / max-*）
  const CSS_DIMENSION_KEYS = ["width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight"];
  for (const key of CSS_DIMENSION_KEYS) {
    const val = mergedArgs[key];
    if (val !== undefined && val !== null && val !== "auto" && val !== "") {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      finalStyle[cssKey] = String(val);
    }
  }

  // 2. 合併條件作用域類名
  finalClassName = [finalClassName, 條件ScopeClass].filter(Boolean).join(" ");

  // 3. 呼叫核心屬性解析器
  const { attrs, 最終Style, 最終ClassName } = 解析最終屬性與樣式({
    tag,
    definition,
    mergedArgs,
    finalOn,
    finalData,
    finalStyle,
    finalClassName,
    variantAlpine: mergedAlpine,
  });

  // 4. 正面剝離框架內部變數，防止 HTML 屬性洩漏
  const 乾淨Attrs: Record<string, any> = {};
  const 框架內部變數 = ['from', 'args', 'definition', 'children', 'repeat', 'slot', '$api', 'styleConditions', 'prepend', 'append', 'wrap'];

  Object.keys(attrs).forEach(key => {
    // 明確過濾掉 data-active / data-hover / data-selected，交由 variantAlpine 專責覆蓋
    if (key !== 'data-active' && key !== 'data-hover' && key !== 'data-selected' && !框架內部變數.includes(key) && typeof attrs[key] !== 'object') {
      乾淨Attrs[key] = attrs[key];
    }
  });

  return {
    class: 最終ClassName,
    style: 最終Style,
    ...乾淨Attrs,
    ...mergedAlpine,    // 🎯 放在最後展開，確保內建 Headless 三態擁有最高優先級與絕對覆蓋權
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Cube 主元件：單一節點、三軌合一的 Headless 原生渲染器
// ═══════════════════════════════════════════════════════════════════════════
export default async function Cube(props: CubeProps): Promise<any> {
  const { context } = props;

  // 📥 準備核心參數（$api 解析、@api 變數、slot 提取）
  const { definition, mergedArgs, childrenProp } = await 準備核心Args(props, context);

  // 🛡️ 第一道鋼鐵防線：絕不回傳 null/undefined，防止 Hono stringBufferToString 崩潰
  // 回傳空字串是最安全的 HTML 護身符，Hono 序列化器能完美吞下
  if (!definition) {
    return "" as any;
  }

  // 🔄 重複器：若有 repeat 配置，原地展開為 Cube 陣列
  if ((definition as any).repeat) {
    return 處理Repeat展開(definition, mergedArgs, childrenProp, context);
  }

  const from = definition.from || "div";

  // 🛡️ 方塊引用鏈遞迴（fallback 查找 → DB 載入 → 定義合併）
  if (from.includes(":")) {
    return 處理方塊引用(from, definition, mergedArgs, childrenProp, context);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 核心主線：原生標籤單一節點渲染路徑 (from 為 a, button, ul, select, div 等)
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 決定最底層的 HTML 肉身標籤
  const 原生Tag =
    (props.tag as string) ||          // 1. 🌟 優先採用外部明確指定或由 Fallback 鏈透傳下來的標籤 (如 "a")
    (definition.tag as string) ||     // 2. 當前圖紙本身定義的 tag
    (definition.from as string) ||    // 3. 繼承來源
    "div";                            // 4. 預設底線

  // ⚡ 智慧判定 Alpine 五態：靜態 Boolean 走 data-*，Alpine 表達式走 :data-*
  const variantAlpine = 解析智慧五態Alpine(mergedArgs);

  // 🎨 條件 CSS 作用域處理（如分隔線）
  let 條件StyleNode: any = null;
  let 條件ScopeClass = "";
  if (definition.styleConditions) {
    const { scopeClass, styleNode } = 處理StyleConditions(definition.styleConditions, mergedArgs);
    if (styleNode) {
      條件StyleNode = styleNode;
      條件ScopeClass = scopeClass;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚡ 4. 終極供電鏈：處理子節點並向下傳導（Context, Color 等）
  // JSX children 優先於 definition.children，若無則 fallback
  let rawChildren = (childrenProp !== undefined && (!Array.isArray(childrenProp) || childrenProp.length > 0))
    ? childrenProp
    : definition.children;

  // 🔄 當 children 來自 definition（JSON 物件）時，包裹為 <Cube> 以遞迴渲染
  if (childrenProp === undefined && rawChildren) {
    const arr = Array.isArray(rawChildren) ? rawChildren : [rawChildren];
    rawChildren = await Promise.all(arr.map(async (child: any) => {
      if (!child || typeof child !== 'object' || !child.from) return child;
      // 剝離 CUBE_META 欄位（由 Cube 從 definition 讀取），其餘作為額外 props 傳入
      const extraProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(child)) {
        if (!CUBE_META.has(k) && v !== undefined) {
          extraProps[k] = v;
        }
      }
      return await jsx(Cube, { definition: child, ...mergedArgs, ...extraProps, context, depth: (props.depth || 0) + 1 });
    }));
  }

  const poweredMergedArgs = { ...mergedArgs, context };

  let flatChildren: any;

  if (rawChildren && (Array.isArray(rawChildren) ? rawChildren.length > 0 : true)) {
    // ⚡ 呼叫 processChildren，讓所有非原生子組件（Cube）獲得 context / color 供電
    const poweredChildren = processChildren(rawChildren, poweredMergedArgs);

    // 👗 處理「衣服規範（wrap）」：逐項穿衣（情境 A）或群組外殼包裹（情境 B）
    if (definition.wrap) {
      const cw = definition.wrap;

      // 判斷是否為列表的特殊子項穿衣需求（本體 tag 是 ul/ol 且 wrap.from 是 li）
      const isListItemWrap = (原生Tag === "ul" || 原生Tag === "ol") && cw.from === "li";

      if (isListItemWrap) {
        // 🌟 情境 A：列表加工廠 — 個別幫每個子項目穿上 <li> 衣服
        // 🔰 先濾除 processChildren 產出的空字串／null，防止 Children.toArray 崩潰
        const validChildren = (Array.isArray(poweredChildren) ? poweredChildren : [poweredChildren])
          .filter((child: any) => child !== null && child !== undefined && child !== "" && typeof child !== "string");

        flatChildren = Children.toArray(validChildren).map((child: any) => {
          return jsx("li", {
            class: substitute(cw.className || "", poweredMergedArgs),
            style: cw.style || {},
            children: child,
          });
        });
      } else {
        // 🌟 情境 B：傳統大外殼包覆 — 把所有 children 整個包起來
        const cwRec = cw as unknown as Record<string, unknown>;
        const { attrs: wrapAttrs, 最終Style: wrapStyle, 最終ClassName: wrapClassName } = 解析最終屬性與樣式({
          tag: (cwRec.from as string) || "div",
          definition: cwRec as Partial<方塊>,
          mergedArgs: poweredMergedArgs,
          finalOn: (cwRec.on as Record<string, string>) || {},
          finalData: (cwRec.data as Record<string, string>) || {},
          finalStyle: (cwRec.style as Record<string, string>) || {},
          finalClassName: substitute((cwRec.className as string) || "", poweredMergedArgs),
        });

        flatChildren = [jsx((cwRec.from as string) || "div", {
          class: wrapClassName,
          style: wrapStyle,
          ...wrapAttrs,
          children: poweredChildren,
        })];
      }
    } else {
      // 🔄 沒有衣服規範，直接使用供電完成的子節點
      flatChildren = poweredChildren;
    }
  } else {
    flatChildren = [];
  }

  // 🎯 本體核心節點（coreNodes）專心扮演「肉身標籤」即可
  const coreNodes = flatChildren;

  // prepend / append 完美留任，可繞過衣服規範塞入「列表標題」
  const prependNodes = processChildren(definition.prepend, poweredMergedArgs);
  const appendNodes = processChildren(definition.append, poweredMergedArgs);

  // 🛡️ 第三道鋼鐵防線：雙重過濾 null/undefined/false，萬物皆空時回傳空字串
  const nativeChildren = [prependNodes, coreNodes, appendNodes]
    .flat()
    .filter((node) => node !== null && node !== undefined && node !== false);

  if (nativeChildren.length === 0 && !條件StyleNode && !(definition as any).text) {
    return "" as any;
  }

  // 將條件 CSS <style> 節點安全推入子項
  if (條件StyleNode) nativeChildren.push(條件StyleNode);

  // 🧼 純淨化過濾：屬性剝離 + 變體處理 + 供電注入
  const 最終純淨Props = 剝離HTML污染屬性(原生Tag, definition, mergedArgs, variantAlpine, 條件ScopeClass);

  // 🔒 通用斷電防線：disabled / 斷電時封鎖游標、注入無障礙標記、移除原生點擊屬性
  if (String(mergedArgs.disabled) === 'true' || mergedArgs.active === false) {
    最終純淨Props.class = 最終純淨Props.class
      .replace(/\b(\w+[:/])*cursor-pointer\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    最終純淨Props.class = `${最終純淨Props.class} !cursor-not-allowed`.trim();
    最終純淨Props["aria-disabled"] = "true";

    // 移除會觸發原生瀏覽器行為的屬性（如 href, action, formaction）
    for (const key of 原生點擊屬性) {
      if (key in 最終純淨Props) delete 最終純淨Props[key];
    }
  }

  // 🖼️ 輸出最乾淨、零 Wrapper 包裹的原生 HTML 節點
  if (isVoidElement(原生Tag)) return jsx(原生Tag, 最終純淨Props);

  const textContent = (definition as any).text ? substitute((definition as any).text as string, mergedArgs) : null;
  return jsx(原生Tag, {
    ...最終純淨Props,
    children: textContent || (nativeChildren.length > 0 ? nativeChildren : undefined),
  });
}
