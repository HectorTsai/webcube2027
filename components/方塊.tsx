// 方塊.tsx (2026 統一方塊渲染器)
// 接收 方塊定義 JSON（或 from 從 DB 載入），渲染出對應的 HTML 元素。
//
// 設計原則：
//   - from 為原生標籤 → 依照定義的 style/className/children 渲染
//   - from 為方塊 ID 且註冊了 fallback → 委派給 fallback 元件
//   - from 為方塊 ID（如 "方塊:方塊:卡片"）→ await DB 載入定義，合併 variant，再渲染
//
// Cube 是 async component — Hono streaming renderer 支援 async function component。
//
// context（即 Hono Context）由系統自動注入（pageService / processChildren 傳播），無需手動傳遞。
import { processChildren } from "./index.ts";
import { jsx } from "hono/jsx/jsx-runtime";
import { Context } from "hono";
import { InnerAPI } from "../services/index.ts";
import { 驗證完整性, 安全過濾Cube } from "../utils/安全過濾器.ts";
import 方塊 from "../database/models/方塊.ts";
import 容器 from "./容器.tsx";
import 圖示 from "./圖示.tsx";
import 圖片 from "./圖片.tsx";

// ---------- 全域 fallback 註冊表 ----------
// 方塊 ID → FallbackComponent。使用者可透過 registerFallback() 註冊自訂方塊，
// 之後使用 <Cube definition={...}> 時不需再傳 fallbacks prop。
//
// 註冊的 fallback 可以被 props.fallbacks 覆蓋，方便測試或臨時替換。
//
// registerFallback(id, component, definition?) — definition 可選，提供 args/variants/slots 等
// 中繼資料，讓使用者只需 from: id 就能享受完整方塊行為，無需自行定義 variant。

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

function isNativeTag(tag: string): boolean {
  return NATIVE_TAGS.has(tag.toLowerCase());
}

function isVoidElement(tag: string): boolean {
  return VOID_ELEMENTS.has(tag.toLowerCase());
}

// ---------- 模板替代 ----------
function substitute(value: string, args: Record<string, unknown>): string {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = args[key];
    return val !== undefined && val !== null ? String(val) : `{${key}}`;
  });
}

// ---------- Props 介面 ----------
/** Fallback 元件簽章：接收合併後的 args + children + context */
export type FallbackComponent = (props: Record<string, unknown>) => any;

export interface CubeProps {
  /** 直接傳入方塊定義（靜態用法，如 slot 定義） */
  definition?: Partial<方塊>;
  /** 方塊 ID（如 "方塊:方塊:卡片"）或原生標籤名（如 "div"）。
   *  非原生、非 fallback 時會自動從 DB 載入定義（透過 context 呼叫 API）。 */
  from?: string;
  /** 執行時期參數，會合併到定義的預設 args 上（與直接 prop 寫法二選一） */
  args?: Record<string, unknown>;
  /** 遞迴深度（內部使用） */
  depth?: number;
  /** Hono Context — 系統自動注入（pageService / processChildren 傳播），無需手動傳遞 */
  context?: Context;
  /** 方塊 ID → fallback 元件的映射 */
  fallbacks?: Record<string, FallbackComponent>;
  /** JSX 子節點 — 當使用 <Cube>...</Cube> 語法時自動傳入 */
  children?: unknown;
  /** 命名 slot 內容 — 注入到 definition.slots 中對應名稱的 slot */
  slots?: Record<string, unknown>;
  /** 其餘 prop 會自動被當成 args 合併 */
  [key: string]: unknown;
}

// ---------- 渲染 children 的共用邏輯 ----------
function renderCubeChildren(
  definition: Partial<方塊>,
  mergedArgs: Record<string, unknown>,
  depth: number,
  context?: Context,
): unknown[] {
  const nodes: unknown[] = [];

  if (definition.slots) {
    for (const slotDef of Object.values(definition.slots)) {
      nodes.push(jsx(Cube, { definition: slotDef as Partial<方塊>, args: mergedArgs, depth: depth + 1, context }));
    }
  }

  if (definition.children) {
    for (const child of definition.children) {
      if (typeof child === 'string') {
        nodes.push(child);
      } else if (child !== null && child !== undefined) {
        nodes.push(jsx(Cube, { definition: child as Partial<方塊>, args: mergedArgs, depth: depth + 1, context }));
      }
    }
  }

  return nodes;
}

// ---------- 載入方塊定義（非同步，僅 cubeId 模式使用）----------
export async function 載入方塊定義(cubeId: string, c: Context): Promise<Partial<方塊> | null> {
  try {
    const response = await InnerAPI(c, `/api/v1/cubes/${cubeId}`);
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
    // 失敗回傳 null
  }
  return null;
}

// ---------- Cube 元件（async）----------
// 方塊定義來自兩個來源：
//   1. definition prop — 直接傳入（靜態定義，如 slot 內部節點）
//   2. from prop — 方塊 ID，非原生/非 fallback 時自動 await DB 載入
//
// Cube 為 async function component，Hono streaming renderer 支援。
export default async function Cube(props: CubeProps): Promise<any> {
  const { definition: staticDefinition, from: cubeId, args: runtimeArgs = {}, depth = 0, context, fallbacks, slots: externalSlots = {}, children: jsxChildren, ...restArgs } = props;

  // ── 深度上限 ──
  if (depth > 10) return null;

  // ── 解析 definition ──
  let definition: Partial<方塊> | undefined = staticDefinition;

  if (!definition && cubeId) {
    if (isNativeTag(cubeId) || fallbackRegistry[cubeId]) {
      // 原生標籤或已註冊 fallback → 直接用 from
      definition = { from: cubeId };
    } else if (context) {
      // 從 DB 載入方塊定義（含 args/variants/slots 等完整中繼資料）
      const loaded = await 載入方塊定義(cubeId, context);
      if (!loaded) {
        return <div class="cube-error">Cube: 無法從資料庫載入方塊定義 "{cubeId}"</div>;
      }
      definition = loaded;
    } else {
      return <div class="cube-error">Cube: 缺少 context，無法從 DB 載入 "{cubeId}"</div>;
    }
  }

  if (!definition) {
    return <div class="cube-error">Cube: 需要 definition 或 from</div>;
  }

  // ── 合併參數（defaults → args prop → rest props）──
  const mergedArgs: Record<string, unknown> = {};
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.default !== undefined) {
        mergedArgs[key] = argDef.default;
      }
    }
  }
  Object.assign(mergedArgs, runtimeArgs, restArgs);

  // ── 決定 children ──
  // 當 definition.slots 存在時，使用 slot-based 渲染：
  //   - 依序渲染每個 slot，若 externalSlots 有對應內容則注入
  //   - "content" slot 會自動接收 JSX children（無需手動傳入）
  //   - 若無 content slot 但有 JSX children，附加在 slots 之後
  // 若無 definition.slots，回退到原本邏輯（JSX children 直接作為子節點）
  let childrenProp: unknown;

  if (definition.slots) {
    const slotNodes: unknown[] = [];
    let jsxChildrenConsumed = false;

    for (const [slotName, slotDef] of Object.entries(definition.slots)) {
      let slotContent = externalSlots[slotName];

      // 自動將 JSX children 放入第一個符合的 slot（依慣例 "body" 或 "content"）
      if (!slotContent && !jsxChildrenConsumed && jsxChildren !== undefined) {
        if (slotName === "body" || slotName === "content") {
          slotContent = jsxChildren;
          jsxChildrenConsumed = true;
        }
      }

      // 無外部內容的 slot：若 slot 定義本身有 from，還是渲染（如 backdrop 的 alpine / on）
      if (slotContent === undefined) {
        // 空殼（純 div wrapper 無屬性）才跳過
        const sd = slotDef as Partial<方塊>;
        if (!sd.from || (sd.from === "div" && !sd.className && !sd.alpine && !sd.on)) continue;
        // 渲染 slot 定義本身（無 children）
        slotNodes.push(jsx(Cube, { definition: sd, args: mergedArgs, depth: depth + 1, context }));
        continue;
      }

      const contentArray = Array.isArray(slotContent) ? slotContent : [slotContent];
      slotNodes.push(jsx(Cube, {
        definition: slotDef as Partial<方塊>,
        args: mergedArgs, depth: depth + 1, context,
        children: contentArray,
      }));
    }

    // 沒有 body/content slot 但有 JSX children → 附加在 slots 之後
    if (!jsxChildrenConsumed && jsxChildren !== undefined) {
      const childrenArray = Array.isArray(jsxChildren) ? jsxChildren : [jsxChildren];
      slotNodes.push(...childrenArray);
    }

    childrenProp = slotNodes.length === 1 ? slotNodes[0] : slotNodes;
  } else {
    // 舊邏輯：JSX 優先，否則從 definition.children 取得
    childrenProp = jsxChildren !== undefined
      ? (Array.isArray(jsxChildren) ? jsxChildren : [jsxChildren])
      : renderCubeChildren(definition, mergedArgs, depth, context);
  }

  // ── 計算 style（模板替代）──
  const finalStyle: Record<string, string> = {};
  if (definition.style) {
    for (const [key, value] of Object.entries(definition.style)) {
      finalStyle[key] = substitute(value, mergedArgs);
    }
  }

  // ── className（初始來自 definition）──
  let finalClassName = definition.className || "";

  // ── variant 合併（args 中有 variants 定義時，依目前值合併 className/style/alpine/on/data）──
  // 無論 native 或 fallback 都先處理，確保變體效果一致
  let variantAlpine: Record<string, unknown> | undefined;
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.variants) {
        const val = String(mergedArgs[key] ?? "");
        const v = argDef.variants[val];
        if (v) {
          if (v.className) finalClassName = finalClassName ? `${finalClassName} ${v.className}` : v.className;
          if (v.style) Object.assign(finalStyle, v.style);
          if (v.alpine) {
            // 合併 variant alpine（尤其是 attrs），避免覆蓋 definition 的 alpine
            if (!variantAlpine) variantAlpine = {};
            for (const [ak, av] of Object.entries(v.alpine)) {
              if (ak === "attrs" && av && variantAlpine.attrs) {
                Object.assign(variantAlpine.attrs as Record<string, unknown>, av as Record<string, unknown>);
              } else {
                variantAlpine[ak] = av;
              }
            }
          }
          if (v.on) Object.assign(definition.on ??= {}, v.on);
          if (v.data) Object.assign(definition.data ??= {}, v.data);
        }
      }
    }
  }

  // ── 解析 from ──
  const from = definition.from ?? "";
  const isNative = isNativeTag(from);

  if (!isNative) {
    // 方塊 ID：檢查 props.fallbacks → 全域 registry → 顯示佔位
    const fallbackFn = fallbacks?.[from] ?? fallbackRegistry[from];
    if (fallbackFn) {
      const cubeClassName = [finalClassName, mergedArgs.className].filter(Boolean).join(" ");

      // 若 definition 帶有 alpine / on / style — 用 wrapper div 承接（如抽屜的 x-show / click.stop）
      const hasWrapperAttrs = !!(definition.alpine || definition.on || Object.keys(finalStyle).length);
      if (hasWrapperAttrs) {
        // 包裝 div ：className + alpine + on + style 都在外層
        // Container 只吃 color / active 等內容參數，填入 h-full 以撐滿包裝高度
        const wrapperAttrs: Record<string, string> = {};
        if (cubeClassName) wrapperAttrs.class = cubeClassName;

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

        if (definition.on) {
          for (const [k, v] of Object.entries(definition.on)) wrapperAttrs[`x-on:${k}`] = substitute(v, mergedArgs);
        }

        if (Object.keys(finalStyle).length) {
          wrapperAttrs.style = Object.entries(finalStyle).map(([k, v]) => `${k}:${v}`).join(";");
        }

        const result = fallbackFn({ ...mergedArgs, context, children: childrenProp, className: 'flex flex-col flex-1 w-full' });
        return jsx("div", { ...wrapperAttrs, children: result });
      }

      const result = fallbackFn({ ...mergedArgs, context, children: childrenProp, className: cubeClassName });
      return result;
    }
    return <div class="cube-reference" data-cube-id={from}>未知方塊: {from}</div>;
  }

  // ── 以下為原生標籤渲染 ──

  // 組裝屬性
  const attrs: Record<string, string> = {};

  // alpine bind（含 variant 覆寫）
  const effectiveAlpine = variantAlpine
    ? {
        ...definition.alpine,
        ...variantAlpine,
        attrs: { ...(definition.alpine?.attrs as Record<string, string> || {}), ...(variantAlpine.attrs as Record<string, string> || {}) },
      }
    : definition.alpine;
  if (effectiveAlpine) {
    const bind = effectiveAlpine.bind as Record<string, string> | undefined;
    if (bind) {
      for (const [key, value] of Object.entries(bind)) {
        attrs[`x-bind:${key}`] = substitute(value, mergedArgs);
      }
    }
    // 通用 x-* 屬性（如 x-transition:enter）
    const attrs_ = effectiveAlpine.attrs as Record<string, string> | undefined;
    if (attrs_) {
      for (const [key, value] of Object.entries(attrs_)) {
        attrs[key.startsWith("x-") ? key : `x-${key}`] = substitute(value, mergedArgs);
      }
    }
    const init = effectiveAlpine.init as string | undefined;
    if (init) {
      attrs["x-init"] = substitute(init, mergedArgs);
    }
    const model = effectiveAlpine.model as string | undefined;
    if (model) {
      attrs["x-model"] = substitute(model, mergedArgs);
    }
  }

  // events
  if (definition.on) {
    for (const [key, value] of Object.entries(definition.on)) {
      attrs[`x-on:${key}`] = substitute(value, mergedArgs);
    }
  }

  // data attributes（通用機制，由方塊定義自行宣告）
  if (definition.data) {
    for (const [key, value] of Object.entries(definition.data)) {
      attrs[`data-${key}`] = substitute(value, mergedArgs);
    }
  }

  // args → HTML 屬性（string 型別的 arg 直接輸出為 HTML 屬性，如 viewBox、xmlns）
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.type === "string" && mergedArgs[key] !== undefined && mergedArgs[key] !== null) {
        attrs[key] = substitute(String(mergedArgs[key]), mergedArgs);
      }
    }
  }

  // ── Void element ──
  if (isVoidElement(from)) {
    return jsx(from, { style: finalStyle, class: finalClassName, ...attrs });
  }

  // ── 最終渲染 ──
  const processed = processChildren(Array.isArray(childrenProp) ? childrenProp : [childrenProp], { context } as Record<string, unknown>);
  const nativeChildren = processed.length === 1 ? processed[0] : processed;
  return jsx(from, {
    style: finalStyle,
    class: finalClassName,
    ...attrs,
    children: nativeChildren,
  });
}