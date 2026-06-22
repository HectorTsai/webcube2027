// 方塊.tsx (2026 統一方塊渲染器)
// 接收 方塊定義 JSON（或 from 從 DB 載入），渲染出對應的 HTML 元素。
import { processChildren } from "./index.ts";
import { jsx } from "hono/jsx/jsx-runtime";
import { Children } from "hono/jsx";
import { Context } from "hono";
import { InnerAPI } from "../services/index.ts"; // 👈 完美保留原版函數式導入
import { 驗證完整性, 安全過濾Cube } from "../utils/安全過濾器.ts";
import 方塊 from "../database/models/方塊.ts";
import 容器 from "./容器.tsx";
import 圖示 from "./圖示.tsx";
import 圖片 from "./圖片.tsx";
import Slot from "./Slot.tsx";
import Template from "./Template.tsx";

/** styleConditions CSS 作用域計數器，確保不同實例的 <style> 不會互相污染 */
let styleScopeId = 0;

// ---------- 全域 fallback 註冊表 ----------
const fallbackRegistry: Record<string, FallbackComponent> = {};

export function registerFallback(id: string, component: FallbackComponent): void {
  fallbackRegistry[id] = component;
}

// 註冊內建元件
registerFallback("方塊:方塊:容器", (props: Record<string, unknown>) => {
  const { children, context: _context, width, height, ...rest } = props;
  const containerStyle: Record<string, string> = {};
  if (width) containerStyle.width = width as string;
  if (height) containerStyle.height = height as string;
  return 容器({ ...rest, width: width as string, height: height as string, style: containerStyle, children });
});

registerFallback("方塊:方塊:圖示", (props: Record<string, unknown>) => 圖示(props));
registerFallback("方塊:方塊:圖片", (props: Record<string, unknown>) => 圖片(props));

// 型別從 database/models/方塊.ts 統一匯出
export type { ArgDef } from "../database/models/方塊.ts";

// ---------- 原生 HTML 元素查表 ----------
const VOID_ELEMENTS = new Set([
  "input", "br", "hr", "img", "meta", "link", "area", "base",
  "col", "embed", "source", "track", "wbr",
]);

const NATIVE_TAGS = new Set([
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "button", "label", "section", "article", "header", "footer",
  "main", "nav", "aside", "ul", "ol", "li", "table", "form",
  "input", "select", "textarea", "img", "video", "audio",
  "i", "b", "strong", "em", "small", "sub", "sup",
]);

const TAG_ATTR_WHITELIST: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "download", "hreflang", "ping", "referrerpolicy"]),
  img: new Set(["src", "alt", "crossorigin", "decoding", "loading", "referrerpolicy", "sizes", "srcset"]),
  input: new Set(["type", "placeholder", "value", "name", "disabled", "readonly", "required", "min", "max", "step", "maxlength", "pattern", "autocomplete", "autofocus"]),
  button: new Set(["type", "disabled", "name", "value", "autofocus"]),
  form: new Set(["action", "method", "target", "enctype", "novalidate", "autocomplete"]),
  label: new Set(["for"]),
  textarea: new Set(["placeholder", "rows", "cols", "maxlength", "readonly", "disabled"]),
  select: new Set(["disabled", "multiple", "name", "required"]),
  video: new Set(["src", "poster", "controls", "autoplay", "loop", "muted", "width", "height"]),
  audio: new Set(["src", "controls", "autoplay", "loop", "muted"]),
};

const GLOBAL_ATTRS = new Set(["id", "title", "tabindex", "role", "aria-label", "aria-hidden", "lang", "dir", "hidden"]);

function isAttrAllowed(tag: string, attr: string): boolean {
  const attrLower = attr.toLowerCase();
  if (GLOBAL_ATTRS.has(attrLower) || attrLower.startsWith("aria-")) return true;
  const allowed = TAG_ATTR_WHITELIST[tag.toLowerCase()];
  if (allowed) return allowed.has(attrLower);
  return false;
}

function flattenChildren(children: any): any[] {
  if (children === undefined || children === null) return [];
  if (Array.isArray(children)) {
    return children.reduce((acc, el) => acc.concat(flattenChildren(el)), [] as any[]);
  }
  if (children && typeof children === 'object') {
    if (children.tag === '' || children.tag === undefined) {
      const innerChildren = children.props?.children || children.children;
      if (innerChildren !== undefined) {
        return flattenChildren(innerChildren);
      }
    }
  }
  return [children];
}

function isNativeTag(tag: string): boolean {
  return NATIVE_TAGS.has(tag.toLowerCase());
}

const CUBE_META = new Set([
  ...Object.keys(new 方塊().toJSON()),
  "shareChildren", "slot", "comment", "if", "__editor",
]);

function isVoidElement(tag: string): boolean {
  return VOID_ELEMENTS.has(tag.toLowerCase());
}

function substitute(value: string, args: Record<string, unknown>): string {
  return value.replace(/\{([\w\-\.\u4e00-\u9fa5]+)\}/g, (_, key: string) => {
    // 支持嵌套属性访问，如 {copyright.開始年份}
    const keys = key.split('.');
    let val: unknown = args;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in (val as Record<string, unknown>)) {
        val = (val as Record<string, unknown>)[k];
      } else {
        val = undefined;
        break;
      }
    }
    return val !== undefined && val !== null ? String(val) : `{${key}}`;
  });
}

// ── $api 語法解析器 ──
// 支持在 JSON 中使用 { "$api": { "path": "/api/v1/info", "field": "商標" } }
// 或簡寫 { "$api": "商標" }（預設 path 為 /api/v1/info）
async function resolveApiReferences(
  obj: unknown,
  context: Context | undefined
): Promise<unknown> {
  if (!obj || typeof obj !== 'object') return obj;
  
  // 處理 $api 標記（檢查是否是單獨的 $api 物件）
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => resolveApiReferences(item, context)));
  }
  
  const objRecord = obj as Record<string, unknown>;
  
  // 如果這是一個 $api 物件（只有 $api 屬性），直接解析
  if ('$api' in objRecord && Object.keys(objRecord).length === 1) {
    const apiConfig = objRecord.$api;
    const path = typeof apiConfig === 'string' ? '/api/v1/info' : (apiConfig as Record<string, unknown>).path as string || '/api/v1/info';
    const field = typeof apiConfig === 'string' ? apiConfig : (apiConfig as Record<string, unknown>).field as string;
    
    if (context && field) {
      try {
        const response = await InnerAPI(context, path);
        const data = await response.json();
        if (data.success && data.data) {
          // 支援巢狀欄位，如 "版權資料.公司"
          const fieldParts = field.split('.');
          let current: any = data.data;
          for (const part of fieldParts) {
            current = current?.[part];
            if (current === undefined) break;
          }
          // 返回 API 結果
          return current;
        }
      } catch {
        // 保持原來的 $api 標記
        return obj;
      }
    }
    return obj;
  }
  
  // 否則遞歸處理物件的屬性
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(objRecord)) {
    result[key] = await resolveApiReferences(value, context);
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

async function renderCubeChildren(
  definition: Partial<方塊>,
  mergedArgs: Record<string, unknown>,
  depth: number,
  context?: Context,
): Promise<unknown[]> {
  const nodes: unknown[] = [];
  if (definition.slots) {
    for (const slotDef of Object.values(definition.slots)) {
      const slotArgs = { ...mergedArgs };
      if ((slotDef as Record<string, unknown>).color === undefined && mergedArgs.color !== undefined) {
        slotArgs.color = mergedArgs.color;
      }
      nodes.push(jsx(Cube, { definition: slotDef as Partial<方塊>, args: slotArgs, depth: depth + 1, context }));
    }
  }
  if (definition.children) {
    for (const child of definition.children) {
      if (typeof child === 'string') {
        nodes.push(child);
      } else if (child !== null && child !== undefined) {
        let childObj = child as Record<string, unknown>;
        
        // 解析 childObj 中的 $api 引用
        if (context) {
          childObj = await resolveApiReferences(childObj, context) as Record<string, unknown>;
        }
        
        // 先收集 childObj 的屬性作為 overrides（包含陣列和物件）
        const overrides: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(childObj)) {
          // CUBE_META 的 key 預設跳過，但 className / style / containerClassName 需要傳給 fallback
          const 需穿透 = k === 'className' || k === 'style' || k === 'containerClassName';
          if (!CUBE_META.has(k) || (k === 'id' && !!childObj.from) || 需穿透) {
            if (typeof v === "string") {
              overrides[k] = substitute(v, mergedArgs);
            } else if (typeof v === "number" || typeof v === "boolean" || Array.isArray(v) || typeof v === "object") {
              overrides[k] = v;
            }
          }
        }
        // 建立 childArgs（包含 childObj 的屬性）
        const childArgs = Object.keys(overrides).length ? { ...mergedArgs, ...overrides } : mergedArgs;
        if (childObj.color === undefined && mergedArgs.color !== undefined) {
          childArgs.color = mergedArgs.color;
        }
        
        // 處理 repeat 屬性（現在可以從 childArgs 中查找）
        const repeatExpr = childObj.repeat as string | undefined;
        if (repeatExpr) {
          // 解析 repeat 值，如 "{items}" -> "items"
          const match = repeatExpr.match(/^\{([\w\-\.]+)\}$/);
          if (match) {
            const repeatKey = match[1];
            const repeatArray = childArgs[repeatKey] as unknown[];
            if (Array.isArray(repeatArray)) {
              for (const item of repeatArray) {
                // 創建帶有 item 變數的 args
                const itemArgs = { ...childArgs, item };
                const repeatOverrides: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(childObj)) {
                  if (k !== 'repeat' && (!CUBE_META.has(k) || (k === 'id' && !!childObj.from)) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
                    repeatOverrides[k] = typeof v === "string" ? substitute(v, itemArgs) : v;
                  }
                }
                const finalArgs = Object.keys(repeatOverrides).length ? { ...itemArgs, ...repeatOverrides } : itemArgs;
                nodes.push(jsx(Cube, { definition: childObj as Partial<方塊>, args: finalArgs, depth: depth + 1, context }));
              }
              continue; // 跳過正常渲染
            }
          }
        }
        
        nodes.push(jsx(Cube, { definition: childObj as Partial<方塊>, args: childArgs, depth: depth + 1, context }));
      }
    }
  }
  return nodes;
}

// ── 🎯 完美還原原汁原味非同步 InnerAPI(c, ...) 請求設計 ──
export async function 載入方塊定義(cubeId: string, c: Context): Promise<Partial<方塊> | null> {
  let reqCache = c.get("cube_request_cache") as Map<string, Partial<方塊>> | undefined;
  if (!reqCache) {
    reqCache = new Map();
    c.set("cube_request_cache", reqCache);
  }
  if (reqCache.has(cubeId)) return reqCache.get(cubeId) || null;

  try {
    const response = await InnerAPI(c, `/api/v1/cubes/${cubeId}`); // 👈 原版非同步函數呼叫
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
      const definition = new 方塊(result.data) as Partial<方塊>;
      reqCache.set(cubeId, definition);
      return definition;
    }
  } catch {
    // 失敗保護
  }
  reqCache.set(cubeId, undefined as any);
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
        const data = await response.json();
        resolved[key] = data.success ? data.data : undefined;
      } catch {
        resolved[key] = undefined;
      }
    }
  }
  return resolved;
}

export default async function Cube(props: CubeProps): Promise<any> {
  const { definition: staticDefinition, from: cubeId, args: runtimeArgs = {}, depth = 0, context, fallbacks, slots: externalSlots = {}, children: jsxChildren, ...restArgs } = props;

  // 藍圖解構引擎
  const 區域樣板庫: Record<string, unknown> = {};
  const 實際待渲染節點: unknown[] = [];

  if (jsxChildren !== undefined) {
    const rawArr = Children.toArray(jsxChildren as any);
    for (const child of rawArr) {
      if (child && typeof child === 'object' && (child as any).tag?.name === 'Template') {
        區域樣板庫[(child as any).props?.name] = (child as any).props?.children;
      } else {
        實際待渲染節點.push(child);
      }
    }
  }

  function 解構插槽與樣板(nodes: unknown): unknown {
    if (!nodes) return nodes;
    if (typeof nodes !== 'object') return nodes;
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    const result: unknown[] = [];

    for (const child of arr) {
      if (!child || typeof child !== 'object') {
        result.push(child);
        continue;
      }
      if ((child as any).tag?.name === 'Slot') {
        const { name, template } = (child as any).props || {};
        if (!template) { result.push(child); continue; }
        const 樣板內容 = 區域樣板庫[template];
        if (!樣板內容) continue;
        const 解開後的內容 = 解構插槽與樣板(樣板內容);
        if (!name) {
          if (Array.isArray(解開後的內容)) {
            result.push(...(解開後的內容 as unknown[]));
          } else {
            result.push(解開後的內容);
          }
        } else {
          result.push({
            ...(child as any),
            props: { ...((child as any).props || {}), template: undefined, children: 解開後的內容 }
          });
        }
        continue;
      }

      const hasChildren = (child as any).props?.children;
      const isCubeComponent = (child as any).tag?.name === 'Cube';
      let nextProps = { ...((child as any).props || {}) };
      if (isCubeComponent) {
        if (nextProps.context === undefined) nextProps.context = context;
        if (nextProps.color === undefined && mergedArgs.color !== undefined) nextProps.color = mergedArgs.color;
      }

      if (hasChildren) {
        const newChildren = 解構插槽與樣板((child as any).props.children);
        nextProps.children = Array.isArray(newChildren) && (newChildren as unknown[]).length === 1 ? (newChildren as unknown[])[0] : newChildren;
        result.push(jsx((child as any).tag, nextProps as any));
      } else if (isCubeComponent) {
        result.push(jsx((child as any).tag, nextProps as any));
      } else {
        result.push(child);
      }
    }
    return result.length === 1 ? result[0] : result;
  }

  if (depth > 10) return null;

  let definition: Partial<方塊> | undefined = staticDefinition;
  let 定義層動態參數: Record<string, unknown> = {};
  if (!definition && cubeId) {
    if (isNativeTag(cubeId) || fallbackRegistry[cubeId]) {
      definition = { from: cubeId };
    } else if (context) {
      definition = await 載入方塊定義(cubeId, context);
    }
  }

  if (definition && definition.from && !isNativeTag(definition.from) && !fallbackRegistry[definition.from] && context) {
    const loaded = await 載入方塊定義(definition.from, context);
    if (loaded) {
      const mergedClassName = [loaded.className, definition.className].filter(Boolean).join(" ");
      const mergedStyle = { ...(loaded.style || {}), ...(definition.style || {}) };
      definition = { ...loaded, ...definition, className: mergedClassName, style: mergedStyle, from: loaded.from || definition.from };
    }
  }

  if (!definition) return null;

  // 解析 definition 中的 $api 引用
  if (context) {
    if (definition.children) {
      definition.children = await resolveApiReferences(definition.children, context) as any[];
    }
    if (definition.slots) {
      definition.slots = await resolveApiReferences(definition.slots, context) as Record<string, any>;
    }
    // 解析 runtimeArgs 中的 $api 引用
    if (runtimeArgs) {
      for (const key of Object.keys(runtimeArgs)) {
        if (runtimeArgs[key] && typeof runtimeArgs[key] === 'object') {
          runtimeArgs[key] = await resolveApiReferences(runtimeArgs[key], context);
        }
      }
    }
    // 解析 restArgs 中的 $api 引用
    if (restArgs) {
      for (const key of Object.keys(restArgs)) {
        if (restArgs[key] && typeof restArgs[key] === 'object') {
          restArgs[key] = await resolveApiReferences(restArgs[key], context);
        }
      }
    }
    // 解析 definition.mergedArgs（@api/... 規格）
    if (definition.mergedArgs) {
      定義層動態參數 = await resolveMergedArgsDef(definition.mergedArgs, context);
    }
  }

  const mergedArgs: Record<string, unknown> = {};
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.default !== undefined) mergedArgs[key] = argDef.default;
    }
  }
  // 全域變數（後續可由 definition.mergedArgs 覆蓋）
  mergedArgs.currentYear = new Date().getFullYear();
  // 合併定義層動態參數（來自 @api/... 解析）
  Object.assign(mergedArgs, 定義層動態參數);
  Object.assign(mergedArgs, runtimeArgs, restArgs);

  const 最終解構後的Children = jsxChildren !== undefined ? 解構插槽與樣板(實際待渲染節點) : undefined;

  let effectiveJsxChildren = 最終解構後的Children;
  const effectiveExtSlots: Record<string, unknown> = { ...(externalSlots as Record<string, unknown>) };

  if (最終解構後的Children !== undefined) {
    const childrenArray = Children.toArray(最終解構後的Children as any);
    const regularChildren: unknown[] = [];
    for (const child of childrenArray) {
      if (child && typeof child === 'object' && ('type' in (child as any) || 'tag' in (child as any))) {
        const node = child as any;
        const nodeType = node.type || node.tag;
        if (nodeType === Slot) {
          const slotName = node.props?.name || '';
          effectiveExtSlots[slotName] = node.props?.children ?? (node as any).children;
          continue;
        }
        if (nodeType === Template) continue;
      }
      regularChildren.push(child);
    }
    effectiveJsxChildren = regularChildren.length === 1 ? regularChildren[0] : regularChildren;
  }

  let childrenProp: unknown;
  if (definition.slots) {
    const slotNodes: unknown[] = [];
    let jsxChildrenConsumed = false;
    for (const [slotName, slotDef] of Object.entries(definition.slots)) {
      const slotArgOverrides: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(slotDef as Record<string, unknown>)) {
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
      if (!slotContent && effectiveJsxChildren !== undefined && (slotDef as any).shareChildren) {
        slotContent = effectiveJsxChildren;
      }
      if (slotContent === undefined) {
        const sd = slotDef as Partial<方塊>;
        if (!sd.from || (sd.from === "div" && !sd.className && !sd.alpine && !sd.on)) continue;
        slotNodes.push(jsx(Cube, { definition: sd, args: childArgs, depth: depth + 1, context }));
        continue;
      }
      const contentArray = Array.isArray(slotContent) ? slotContent : [slotContent];
      slotNodes.push(jsx(Cube, { definition: slotDef as Partial<方塊>, args: childArgs, depth: depth + 1, context, children: contentArray }));
    }
    if (!jsxChildrenConsumed && effectiveJsxChildren !== undefined) {
      slotNodes.push(...(Children.toArray(effectiveJsxChildren as any) as unknown[]).flat(Infinity));
    }
    if (definition.children) {
      const seedChildren = await renderCubeChildren(definition, mergedArgs, depth, context);
      slotNodes.push(...seedChildren);
    }
    childrenProp = slotNodes.length === 1 ? slotNodes[0] : slotNodes;
  } else {
    childrenProp = effectiveJsxChildren !== undefined
      ? (Children.toArray(effectiveJsxChildren as any) as unknown[]).flat(Infinity)
      : await renderCubeChildren(definition, mergedArgs, depth, context);
  }

  const finalStyle: Record<string, string> = {};
  if (definition.style) {
    for (const [key, value] of Object.entries(definition.style)) finalStyle[key] = substitute(value, mergedArgs);
  }

  let finalClassName = definition.className || "";
  let variantAlpine: Record<string, unknown> | undefined;
  let variantContainerCls = "";
  let variantWrapCls = "";
  const finalOn: Record<string, string> = { ...definition.on };
  const finalData: Record<string, string> = { ...definition.data };
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.variants) {
        const val = String(mergedArgs[key] ?? "");
        const v = argDef.variants[val];
        if (v) {
          if (v.className) finalClassName = finalClassName ? `${finalClassName} ${v.className}` : v.className;
          if (v.containerClassName) variantContainerCls = variantContainerCls ? `${variantContainerCls} ${v.containerClassName}` : v.containerClassName;
          if (v.wrapClassName) variantWrapCls = variantWrapCls ? `${variantWrapCls} ${v.wrapClassName}` : v.wrapClassName;
          if (v.style) Object.assign(finalStyle, v.style);
          if (v.alpine) {
            if (!variantAlpine) variantAlpine = {};
            for (const [ak, av] of Object.entries(v.alpine)) {
              if (ak === "attrs" && av && variantAlpine.attrs) {
                Object.assign(variantAlpine.attrs as Record<string, unknown>, av as Record<string, unknown>);
              } else {
                variantAlpine[ak] = av;
              }
            }
          }
          if (v.on) Object.assign(finalOn, v.on);
          if (v.data) Object.assign(finalData, v.data);
        }
      }
    }
  }

  if (mergedArgs.className) {
    finalClassName = [finalClassName, mergedArgs.className as string].filter(Boolean).join(" ");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 補回「水平排列」與「斑馬紋」核心控制電路 (WrapChild 點名引擎)
  // ═══════════════════════════════════════════════════════════════════════════
  let wrappedChildArray: unknown[];
  if (definition.wrapChild && childrenProp !== undefined && childrenProp !== null) {
    const w = definition.wrapChild! as unknown as Record<string, unknown>;
    const wTag = w.from as string || "div";
    const wst = w.style as Record<string, string> | undefined;
    const baseWCls = w.className ? substitute(w.className as string, mergedArgs) : "";
    
    // 透過傳入 index 參數，精確解析斑馬紋及排列狀態
    wrappedChildArray = Children.map(childrenProp as any, (child, index) => {
      if (child === undefined || child === null) return null;
      
      // 1. 動態計算動態樣式類（結合水平排列與斑馬紋）
      let dynamicWCls = baseWCls;
      
      // 🌿 斑馬紋 (Zebra stripe) 融合電路
      if (mergedArgs.zebra === true || mergedArgs.zebra === "true") {
        const isEven = index % 2 === 0;
        const zebraClass = isEven ? "bg-slate-50/60 dark:bg-slate-900/40" : "bg-transparent";
        dynamicWCls = dynamicWCls ? `${dynamicWCls} ${zebraClass}` : zebraClass;
      }
      
      // 🌿 水平排列 / 垂直分布對齊修正
      if (mergedArgs.layout === "horizontal" || mergedArgs.horizontal === true) {
        const layoutClass = "flex-1 min-w-0"; // 防止水平擠壓爆版
        dynamicWCls = dynamicWCls ? `${dynamicWCls} ${layoutClass}` : layoutClass;
      }

      const wStyle: Record<string, string> = {};
      if (wst) {
        for (const [k, v] of Object.entries(wst)) {
          wStyle[k] = substitute(v, { ...mergedArgs, $index: index });
        }
      }

      const currentWProps: Record<string, unknown> = {};
      if (dynamicWCls) currentWProps.class = dynamicWCls.trim();
      if (Object.keys(wStyle).length) currentWProps.style = wStyle;

      // 提升無障礙與核心特徵屬性
      if (child && typeof child === 'object' && 'props' in (child as any)) {
        const childProps = (child as any).props || {};
        for (const [k, v] of Object.entries(childProps)) {
          if ((k === 'role' || k.startsWith('aria-')) && v !== undefined && v !== '') {
            (currentWProps as any)[k] = v;
          }
        }
      }
      return jsx(wTag, { ...currentWProps, children: child } as any);
    }) as any;
  } else {
    wrappedChildArray = Children.toArray(childrenProp as any) as any;
  }
  // ═══════════════════════════════════════════════════════════════════════════

  const prependNodes: unknown[] = [];
  const appendNodes: unknown[] = [];

  function renderAffix(affixDef: Record<string, unknown>): unknown {
    const tag = (affixDef.from as string) || "div";
    const cls = affixDef.className ? substitute(affixDef.className as string, mergedArgs) : "";
    const st = affixDef.style as Record<string, string> | undefined;
    const affixStyle: Record<string, string> = {};
    if (st) for (const [k, v] of Object.entries(st)) affixStyle[k] = substitute(v, mergedArgs);
    const props: Record<string, unknown> = {};
    if (cls) props.class = cls;
    if (Object.keys(affixStyle).length) props.style = affixStyle;
    const affixChildren = affixDef.children as (string | Record<string, unknown>)[] | undefined;
    if (affixChildren) {
      props.children = affixChildren.map(c =>
        typeof c === "string" ? substitute(c, mergedArgs) : jsx(Cube, { definition: c as Partial<方塊>, args: { ...mergedArgs, ...(((c as Record<string, unknown>).color === undefined && mergedArgs.color !== undefined) ? { color: mergedArgs.color } : {}) }, depth: depth + 1, context })
      );
    }
    return jsx(tag, props as any);
  }

  if (definition.prepend) {
    for (const p of (definition.prepend as unknown as Record<string, unknown>[])) {
      const cond = p.if as string | undefined;
      if (cond && !mergedArgs[cond]) continue;
      prependNodes.push(renderAffix(p));
    }
  }
  if (definition.append) {
    for (const a of (definition.append as unknown as Record<string, unknown>[])) {
      const cond = a.if as string | undefined;
      if (cond && !mergedArgs[cond]) continue;
      appendNodes.push(renderAffix(a));
    }
  }

  if (definition.wrap) {
    const w = definition.wrap as unknown as Record<string, unknown>;
    const wrapTag = w.from as string || "div";
    const wrapCls = [w.className ? substitute(w.className as string, mergedArgs) : "", variantWrapCls].filter(Boolean).join(" ");
    const wst = w.style as Record<string, string> | undefined;
    const wrapStyle: Record<string, string> = {};
    if (wst) for (const [k, v] of Object.entries(wst)) wrapStyle[k] = substitute(v, mergedArgs);
    const wrapProps: Record<string, unknown> = {};
    if (wrapCls) wrapProps.class = wrapCls;
    if (Object.keys(wrapStyle).length) wrapProps.style = wrapStyle;

    const wrapInner: unknown[] = [];
    const styleNodes: unknown[] = [];
    let scopeClass = "";
    if (definition.styleConditions) {
      const scMap = definition.styleConditions as Record<string, string>;
      for (const [argName, cssText] of Object.entries(scMap)) {
        const argVal = mergedArgs[argName];
        if (argVal) {
          if (!scopeClass) {
            scopeClass = `sc-${styleScopeId++}`;
            const existingWrapCls = (wrapProps.class as string) || "";
            wrapProps.class = existingWrapCls ? `${existingWrapCls} ${scopeClass}` : scopeClass;
          }
          const scopedCss = `.${scopeClass} ${cssText}`;
          styleNodes.push(jsx("style", { children: scopedCss } as Record<string, unknown>));
        }
      }
    }
    wrapInner.push(...wrappedChildArray);
    const wrapped = w.void ? jsx(wrapTag, wrapProps as any) : jsx(wrapTag, { ...wrapProps, children: wrapInner } as any);
    childrenProp = [...prependNodes, ...styleNodes, wrapped, ...appendNodes];
  } else {
    childrenProp = [...prependNodes, ...wrappedChildArray, ...appendNodes];
  }

  if (Array.isArray(childrenProp) && childrenProp.length === 1) {
    childrenProp = childrenProp[0];
  }

  const from = definition.from ?? "";
  const isNative = isNativeTag(from);

  if (!isNative) {
    const fallbackFn = fallbacks?.[from] ?? fallbackRegistry[from];
    if (fallbackFn) {
      const cubeClassName = finalClassName;
      const hasWrapperAttrs = !!(definition.alpine || Object.keys(finalOn).length > 0 || Object.keys(finalStyle).length || definition.tag);
      if (hasWrapperAttrs) {
        const wrapperTag = definition.tag || "div";
        const wrapperAttrs: Record<string, any> = {};
        let wrapperClass = cubeClassName;
        if (wrapperTag === "a" && mergedArgs.disabled) {
          wrapperClass = wrapperClass.replace(/\bcursor-pointer\b/g, "cursor-default");
        }
        if (wrapperClass) wrapperAttrs.class = wrapperClass;
        if (definition.attrs) {
          for (const [k, v] of Object.entries(definition.attrs)) wrapperAttrs[k] = v;
        }

        const effectiveAlpine = variantAlpine
          ? {
              ...definition.alpine,
              ...variantAlpine,
              attrs: { ...(definition.alpine?.attrs as Record<string, string> || {}), ...(variantAlpine.attrs as Record<string, string> || {}) },
            }
          : definition.alpine;

        if (effectiveAlpine) {
          const bind = effectiveAlpine.bind as Record<string, string> | undefined;
          if (bind) for (const [k, v] of Object.entries(bind)) wrapperAttrs[`x-bind:${k}`] = substitute(v, mergedArgs);
          const a = effectiveAlpine.attrs as Record<string, string> | undefined;
          if (a) for (const [k, v] of Object.entries(a)) wrapperAttrs[k.startsWith("x-") ? k : `x-${k}`] = substitute(v, mergedArgs);
          if (effectiveAlpine.init) wrapperAttrs["x-init"] = substitute(effectiveAlpine.init as string, mergedArgs);
          if (effectiveAlpine.model) wrapperAttrs["x-model"] = substitute(effectiveAlpine.model as string, mergedArgs);
        }
        if (Object.keys(finalOn).length > 0) {
          for (const [k, v] of Object.entries(finalOn)) wrapperAttrs[`x-on:${k}`] = substitute(v, mergedArgs);
        }
        for (const [k, v] of Object.entries(mergedArgs)) {
          if (typeof k === "string" && (k.startsWith("x-") || k.startsWith("@")) && typeof v === "string") wrapperAttrs[k] = v;
        }
        const RESERVED = new Set(['color','size','disabled','active','hover','width','height','padding','className','style','context','children','definition','from','args','depth','fallbacks','slots']);
        for (const [k, v] of Object.entries(mergedArgs)) {
          if (typeof k === "string" && !k.startsWith("x-") && !k.startsWith("@") && !k.startsWith("data-") && !RESERVED.has(k) && !(k in wrapperAttrs) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
            if (isAttrAllowed(wrapperTag, k)) wrapperAttrs[k] = v;
          }
        }
        if (Object.keys(finalStyle).length) wrapperAttrs.style = finalStyle;

        const containerCls = ['flex flex-col flex-1 w-full', definition.containerClassName, variantContainerCls, mergedArgs.className].filter(Boolean).join(" ");
        const fromCube = definition.from ?? "";
        const fallbackArgs: Record<string, unknown> = {};
        if (fromCube === "方塊:方塊:容器") {
          const CONTAINER_KEYS = new Set(['color','active','activeStateName','hover','padding','width','height','style']);
          for (const k of CONTAINER_KEYS) {
            if (k in mergedArgs) fallbackArgs[k] = mergedArgs[k];
          }
          if (mergedArgs.disabled) fallbackArgs.active = false;
        } else {
          const FALLBACK_FILTER = new Set(['context','children','definition','from','args','depth','fallbacks','slots','className']);
          for (const [k, v] of Object.entries(mergedArgs)) {
            if (!FALLBACK_FILTER.has(k)) fallbackArgs[k] = v;
          }
        }

        const dynDisabledExpr = wrapperAttrs["x-bind:disabled"];
        if (dynDisabledExpr && dynDisabledExpr !== "true" && dynDisabledExpr !== "false") {
          const patchExpr = `let _d=(${dynDisabledExpr});$el.style.cursor=_d?'default':'';const _a=$el.querySelector('[data-active]');if(_a)_a.setAttribute('data-active',_d?'false':'true')`;
          wrapperAttrs["x-effect"] = wrapperAttrs["x-effect"] ? `${wrapperAttrs["x-effect"]}; ${patchExpr}` : patchExpr;
        }

        const result = fallbackFn({ ...fallbackArgs, context, children: childrenProp, className: containerCls });
        return jsx(wrapperTag, { ...wrapperAttrs, children: result });
      }
      return fallbackFn({ ...mergedArgs, context, children: childrenProp, className: cubeClassName });
    }
    return <div class="cube-reference" data-cube-id={from}>未知方塊: {from}</div>;
  }

  const attrs: Record<string, any> = {};
  const effectiveAlpine2 = variantAlpine ? { ...definition.alpine, ...variantAlpine, attrs: { ...(definition.alpine?.attrs as Record<string, string> || {}), ...(variantAlpine.attrs as Record<string, string> || {}) } } : definition.alpine;
  if (effectiveAlpine2) {
    const bind = effectiveAlpine2.bind as Record<string, string> | undefined;
    if (bind) { for (const [key, value] of Object.entries(bind)) attrs[`x-bind:${key}`] = substitute(value, mergedArgs); }
    const attrs_ = effectiveAlpine2.attrs as Record<string, string> | undefined;
    if (attrs_) { for (const [key, value] of Object.entries(attrs_)) attrs[key.startsWith("x-") ? key : `x-${key}`] = substitute(value, mergedArgs); }
    if (effectiveAlpine2.init) attrs["x-init"] = substitute(effectiveAlpine2.init as string, mergedArgs);
    if (effectiveAlpine2.model) attrs["x-model"] = substitute(effectiveAlpine2.model as string, mergedArgs);
  }
  if (Object.keys(finalOn).length > 0) {
    for (const [key, value] of Object.entries(finalOn)) attrs[`x-on:${key}`] = substitute(value, mergedArgs);
  }
  if (Object.keys(finalData).length > 0) {
    for (const [key, value] of Object.entries(finalData)) attrs[`data-${key}`] = substitute(value, mergedArgs);
  }

  const NATIVE_RESERVED = new Set(['className','style','context','children','definition','from','args','depth','fallbacks','slots']);
  for (const [k, v] of Object.entries(mergedArgs)) {
    if (typeof k === "string" && !k.startsWith("x-") && !k.startsWith("@") && !k.startsWith("data-") && !NATIVE_RESERVED.has(k) && !(k in attrs) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
      if (isAttrAllowed(from, k)) attrs[k] = v;
    }
  }
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.type === "string" && mergedArgs[key] !== undefined && mergedArgs[key] !== null) {
        if (isAttrAllowed(from, key)) attrs[key] = substitute(String(mergedArgs[key]), mergedArgs);
      }
    }
  }

  if (isVoidElement(from)) return jsx(from, { style: finalStyle, class: finalClassName, ...attrs });

  let nativeChildren: unknown;
  const defText = (definition as Record<string, unknown>).text as string | undefined;
  if (defText) {
    // 处理 text 属性，作为元素的文本内容
    const textContent = substitute(defText, mergedArgs);
    nativeChildren = textContent;
  } else {
    const flatChildrenProp = Array.isArray(childrenProp) ? childrenProp.flat(Infinity) : [childrenProp];
    const processed = processChildren(flatChildrenProp, { ...mergedArgs, context } as Record<string, unknown>);
    nativeChildren = processed.length === 1 ? processed[0] : processed;
  }
  return jsx(from, { style: finalStyle, class: finalClassName, ...attrs, children: nativeChildren });
}