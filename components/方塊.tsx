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
import Slot from "./Slot.tsx";
import Template from "./Template.tsx";

/** styleConditions CSS 作用域計數器，確保不同實例的 <style> 不會互相污染 */
let styleScopeId = 0;

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

// 每個 tag 允許透傳的 HTML 屬性白名單（防止非法屬性洩漏）
const TAG_ATTR_WHITELIST: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "download", "hreflang", "ping", "referrerpolicy", "download"]),
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

// HTML 全域屬性（所有 tag 都允許），不受 per-tag 白名單限制
const GLOBAL_ATTRS = new Set(["id", "title", "tabindex", "role", "aria-label", "aria-hidden", "lang", "dir"]);

function isAttrAllowed(tag: string, attr: string): boolean {
  const attrLower = attr.toLowerCase();
  // 全域屬性或無障礙 aria-* 直接放行
  if (GLOBAL_ATTRS.has(attrLower) || attrLower.startsWith("aria-")) return true;
  const allowed = TAG_ATTR_WHITELIST[tag.toLowerCase()];
  if (allowed) return allowed.has(attrLower);
  // 非特定 tag（如 div/span/section）只接受 data-*、x-* 和全域屬性，不接受其他裸屬性
  // 注意：SVG 元素不在此處支援，請使用 方塊:方塊:圖示 統一處理
  return false;
}

function isNativeTag(tag: string): boolean {
  return NATIVE_TAGS.has(tag.toLowerCase());
}

function isVoidElement(tag: string): boolean {
  return VOID_ELEMENTS.has(tag.toLowerCase());
}

// ---------- 模板替代 ----------
function substitute(value: string, args: Record<string, unknown>): string {
  return value.replace(/\{([\w\-\.]+)\}/g, (_, key: string) => {
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

// ── 載入方塊定義（非同步，僅 cubeId 模式使用）──
// 使用 Hono Context 存放請求級別快取，避免跨請求全域污染與記憶體洩漏
export async function 載入方塊定義(cubeId: string, c: Context): Promise<Partial<方塊> | null> {
  let reqCache = c.get("cube_request_cache") as Map<string, Partial<方塊>> | undefined;
  if (!reqCache) {
    reqCache = new Map();
    c.set("cube_request_cache", reqCache);
  }
  const cached = reqCache.get(cubeId);
  if (cached) return cached;

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
      const definition = new 方塊(result.data) as Partial<方塊>;
      reqCache.set(cubeId, definition);
      return definition;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 👑 區域範疇圖紙解構引擎 (Scoped Blueprint Engine) - 完全體
  // ═══════════════════════════════════════════════════════════════════════════

  // 階段一：收集當前 Cube 作用域內的所有 Template 藍圖
  const 區域樣板庫: Record<string, unknown> = {};
  const 實際待渲染節點: unknown[] = [];

  if (jsxChildren !== undefined) {
    // 確保使用平坦化陣列處理，防止巢狀 children 漏勾
    const rawArr = Array.isArray(jsxChildren) ? jsxChildren : [jsxChildren];
    for (const child of rawArr) {
      if (child && typeof child === 'object' && (child as any).tag?.name === 'Template') {
        區域樣板庫[(child as any).props?.name] = (child as any).children ?? (child as any).props?.children;
      } else {
        實際待渲染節點.push(child);
      }
    }
  }

  // 階段二：遞迴解構函數 — 使用安全物件操作 (Spread)，防止 Hono 渲染器吞節點
  function 解構插槽與樣板(nodes: unknown): unknown {
    if (!nodes) return nodes;
    
    // 如果是已被 Hono 預先渲染好的 HtmlEscapedString 死字串，直接放行
    if (typeof nodes !== 'object') return nodes;

    const arr = Array.isArray(nodes) ? nodes : [nodes];
    const result: unknown[] = [];

    for (const child of arr) {
      if (!child || typeof child !== 'object') {
        result.push(child);
        continue;
      }

      // 🎯 偵測 Slot 元件
      if ((child as any).tag?.name === 'Slot') {
        const { name, template } = (child as any).props || {};
        if (!template) { result.push(child); continue; }

        const 樣板內容 = 區域樣板庫[template];
        if (!樣板內容) continue; // 找不到樣板則剔除 (Fallback to null)

        // 核心：無論如何，樣板內容本身可能含有深層 Slot，必須遞迴解開
        const 解開後的內容 = 解構插槽與樣板(樣板內容);

        if (!name) {
          // A. 無 name → 內聯展開 (Inline Macro)，直接打平塞入
          if (Array.isArray(解開後的內容)) {
            result.push(...(解開後的內容 as unknown[]));
          } else {
            result.push(解開後的內容);
          }
        } else {
          // B. 有 name → 保留 Slot 殼子。改用安全 Spread 語法，防禦 props 缺失
          result.push({
            ...(child as any),
            props: {
              ...((child as any).props || {}),
              template: undefined, // 消除標記，避免下游重複解構
              children: 解開後的內容
            }
          });
        }
        continue;
      }

      // 🎯 常規節點：遞迴處理其內部 children 屬性
      const hasChildren = (child as any).props?.children;
      const isCubeComponent = (child as any).tag?.name === 'Cube';

      // 🛡️ 如果解構出來的子節點是 Cube 且缺少 context，立刻注入當前外層 Cube 的 context
      // 否則它稍後非同步執行時無法存取 InnerAPI 與資料庫
      let nextProps = { ...((child as any).props || {}) };
      if (isCubeComponent && nextProps.context === undefined) {
        nextProps.context = context;
      }

      if (hasChildren) {
        const newChildren = 解構插槽與樣板((child as any).props.children);
        nextProps.children = Array.isArray(newChildren) && (newChildren as unknown[]).length === 1 ? (newChildren as unknown[])[0] : newChildren;

        // 使用 jsx() 建立真正的 Hono VNode（spread 的 plain object 會被 Hono toString() → [object Object]）
        result.push(jsx((child as any).tag, nextProps as any));
      } else if (isCubeComponent) {
        // 即使沒有 children，Cube 也要換上補了 context 的 props
        result.push(jsx((child as any).tag, nextProps as any));
      } else {
        result.push(child);
      }
    }

    return result.length === 1 ? result[0] : result;
  }

  // 執行解構
  const 最終解構後的Children = jsxChildren !== undefined ? 解構插槽與樣板(實際待渲染節點) : undefined;
  // ═══════════════════════════════════════════════════════════════════════════

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

  // slot 定義有 from 指向其他 Cube 時，從 DB 載入並合併（如抽屜 slot）
  if (definition && definition.from && !isNativeTag(definition.from) && !fallbackRegistry[definition.from] && context) {
    const loaded = await 載入方塊定義(definition.from, context);
    if (loaded) {
      // 合併：DB 定義為基底，slot 定義的屬性覆蓋
      definition = { ...loaded, ...definition, from: loaded.from || definition.from };
    }
  }

  if (!definition) {
    return <div class="cube-error">Cube: 需要 definition 或 from</div>;
  }

  // ── 合併參數（defaults → args prop → rest props）──
  // processChildren 會將 mergedArgs 注入子元件中，因此全量保留
  const mergedArgs: Record<string, unknown> = {};
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.default !== undefined) {
        mergedArgs[key] = argDef.default;
      }
    }
  }
  Object.assign(mergedArgs, runtimeArgs, restArgs);

  // ── Slot 掃描 ──
  // 此時所有 <Slot template="xxx" /> 已在階段二解構完畢。
  // 剩下的 Slot 只有兩種：
  let effectiveJsxChildren = 最終解構後的Children;
  const effectiveExtSlots: Record<string, unknown> = { ...(externalSlots as Record<string, unknown>) };

  if (最終解構後的Children !== undefined) {
    const childrenArray = Array.isArray(最終解構後的Children) ? 最終解構後的Children : [最終解構後的Children as any];
    const regularChildren: unknown[] = [];

    for (const child of childrenArray) {
      if (child && typeof child === 'object' && ('type' in (child as any) || 'tag' in (child as any))) {
        const node = child as any;
        const nodeType = node.type || node.tag;

        // <Slot name="xxx"> → collect into externalSlots
        if (nodeType === Slot) {
          const slotName = node.props?.name || '';
          effectiveExtSlots[slotName] = node.props?.children ?? (node as any).children;
          continue;
        }

        // 防禦性：Template 已在階段一沒收，不應出現於此
        if (nodeType === Template) continue;
      }
      regularChildren.push(child);
    }

    effectiveJsxChildren = regularChildren.length === 1 ? regularChildren[0] : regularChildren;
  }

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
      // 從 slotDef 提取額外屬性並做模板替換，合併到子 Cube 的 args（color, state, position...）
      const META = new Set(["from", "className", "style", "alpine", "on", "children", "slots", "shareChildren", "args", "data", "wrap", "prepend", "append", "styleConditions", "containerClassName", "tag", "attrs"]);
      const slotArgOverrides: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(slotDef as Record<string, unknown>)) {
        if (!META.has(k) && v !== undefined) {
          slotArgOverrides[k] = typeof v === "string" ? substitute(v as string, mergedArgs) : v;
        }
      }
      // processChildren 會將 args 傳播給子元件，slotArgOverrides 覆蓋特定值
      const childArgs = Object.keys(slotArgOverrides).length ? { ...mergedArgs, ...slotArgOverrides } : mergedArgs;

      let slotContent = effectiveExtSlots[slotName];

      // 自動將 JSX children 放入第一個符合的 slot（依慣例 "body" 或 "content"）
      if (!slotContent && !jsxChildrenConsumed && effectiveJsxChildren !== undefined) {
        if (slotName === "body" || slotName === "content") {
          slotContent = effectiveJsxChildren;
          jsxChildrenConsumed = true;
        }
      }

      // shareChildren：多個 slot 共享同一份 JSX children（如主選單桌面版 + 抽屜）
      if (!slotContent && effectiveJsxChildren !== undefined && (slotDef as any).shareChildren) {
        slotContent = effectiveJsxChildren;
      }

      // 無外部內容的 slot：若 slot 定義本身有 from，還是渲染（如 backdrop 的 alpine / on）
      if (slotContent === undefined) {
        // 空殼（純 div wrapper 無屬性）才跳過
        const sd = slotDef as Partial<方塊>;
        if (!sd.from || (sd.from === "div" && !sd.className && !sd.alpine && !sd.on)) continue;
        // 渲染 slot 定義本身（無 children）
        slotNodes.push(jsx(Cube, { definition: sd, args: childArgs, depth: depth + 1, context }));
        continue;
      }

      const contentArray = Array.isArray(slotContent) ? slotContent : [slotContent];
      slotNodes.push(jsx(Cube, {
        definition: slotDef as Partial<方塊>,
        args: childArgs, depth: depth + 1, context,
        children: contentArray,
      }));
    }

    // 沒有 body/content slot 但有 JSX children → 附加在 slots 之後
    if (!jsxChildrenConsumed && effectiveJsxChildren !== undefined) {
      const childrenArray = Array.isArray(effectiveJsxChildren) ? effectiveJsxChildren : [effectiveJsxChildren];
      slotNodes.push(...childrenArray);
    }

    // seed 定義的 children（如主選單的漢堡按鈕）也一併渲染
    if (definition.children) {
      const seedChildren = renderCubeChildren(definition, mergedArgs, depth, context);
      slotNodes.push(...seedChildren);
    }

    childrenProp = slotNodes.length === 1 ? slotNodes[0] : slotNodes;
  } else {
    // 舊邏輯：JSX 優先，否則從 definition.children 取得
    childrenProp = effectiveJsxChildren !== undefined
      ? (Array.isArray(effectiveJsxChildren) ? effectiveJsxChildren : [effectiveJsxChildren])
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

  // ── variant 合併（不修改 definition，使用局部變數防止渲染實例互相污染）──
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

  // ── wrap / prepend / append / styleConditions（通用擴充，純 JSON 描述）──
  // 所有方塊都支援此擴充：children 先用 wrap.from 包裹，再於前後附加 prepend/append。
  // prepend/append 支援條件式 { if: "argName" } — 對應 arg 為 truthy 時才渲染。
  // styleConditions[argName] 在 arg 為 truthy 時於 wrap 內注入 <style>。
  const childArray = Array.isArray(childrenProp) ? childrenProp : [childrenProp];

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
        typeof c === "string" ? substitute(c, mergedArgs) : jsx(Cube, { definition: c as Partial<方塊>, args: mergedArgs, depth: depth + 1, context })
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
    // styleConditions 注入 — 放在 wrap 外面當兄弟節點，透過作用域 class 避免污染其他實例
    const styleNodes: unknown[] = [];
    let scopeClass = "";
    if (definition.styleConditions) {
      const scMap = definition.styleConditions as Record<string, string>;
      for (const [argName, cssText] of Object.entries(scMap)) {
        const argVal = mergedArgs[argName];
        if (argVal) {
          if (!scopeClass) {
            scopeClass = `sc-${styleScopeId++}`;
            // 加入 wrap 的 class，讓 CSS 只作用於這個 wrap
            const existingWrapCls = (wrapProps.class as string) || "";
            wrapProps.class = existingWrapCls ? `${existingWrapCls} ${scopeClass}` : scopeClass;
          }
          const scopedCss = `.${scopeClass} ${cssText}`;
          styleNodes.push(jsx("style", { children: scopedCss } as Record<string, unknown>));
        }
      }
    }
    wrapInner.push(...childArray);

    const wrapped = w.void
      ? jsx(wrapTag, wrapProps as any)
      : jsx(wrapTag, { ...wrapProps, children: wrapInner } as any);
    childrenProp = [...prependNodes, ...styleNodes, wrapped, ...appendNodes];
  } else {
    childrenProp = [...prependNodes, ...childArray, ...appendNodes];
  }

  if (Array.isArray(childrenProp) && childrenProp.length === 1) {
    childrenProp = childrenProp[0];
  }

  // ── 解析 from ──
  const from = definition.from ?? "";
  const isNative = isNativeTag(from);

  if (!isNative) {
    // 方塊 ID：檢查 props.fallbacks → 全域 registry → 顯示佔位
    const fallbackFn = fallbacks?.[from] ?? fallbackRegistry[from];
    if (fallbackFn) {
      const cubeClassName = [finalClassName, mergedArgs.className].filter(Boolean).join(" ");

      // 若 definition 帶有 alpine / on / style / tag — 用 wrapper 承接
      // tag 允許指定包裝標籤（如 "button" 讓 Container 有按鈕行為）
      const hasWrapperAttrs = !!(definition.alpine || Object.keys(finalOn).length > 0 || Object.keys(finalStyle).length || definition.tag);
      if (hasWrapperAttrs) {
        const wrapperTag = definition.tag || "div";
        const wrapperAttrs: Record<string, any> = {};
        // <a> 沒有 :disabled pseudo-class，disabled 時手動覆蓋 cursor
        let wrapperClass = cubeClassName;
        if (wrapperTag === "a" && mergedArgs.disabled) {
          wrapperClass = wrapperClass.replace(/\bcursor-pointer\b/g, "cursor-default");
        }
        if (wrapperClass) wrapperAttrs.class = wrapperClass;

        // 靜態 HTML 屬性（如 type="button"）
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

        // 透傳 runtime 傳入的 Alpine 屬性（如 x-on:click, x-bind:disabled）
        for (const [k, v] of Object.entries(mergedArgs)) {
          if (typeof k === "string" && (k.startsWith("x-") || k.startsWith("@")) && typeof v === "string") {
            wrapperAttrs[k] = v;
          }
        }

        // 透傳 runtime 傳入的一般 HTML 屬性（如 href, target, rel, download, disabled, required），
        // 跳過設計系統保留字、Alpine 屬性、已被 wrapper build 階段設定過的屬性。
        // 依 wrapperTag 白名單過濾，防止 <div href="/about"> 等非法屬性洩漏。
        // 型別放寬支援 boolean，Hono JSX 會自動處理 disabled={true} → disabled。
        const RESERVED = new Set(['color','size','disabled','active','hover','width','height','padding','className','style','context','children','definition','from','args','depth','fallbacks','slots']);
        for (const [k, v] of Object.entries(mergedArgs)) {
          if (typeof k === "string" && !k.startsWith("x-") && !k.startsWith("@") && !k.startsWith("data-") && !RESERVED.has(k) && !(k in wrapperAttrs) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
            if (isAttrAllowed(wrapperTag, k)) {
              wrapperAttrs[k] = v;
            }
          }
        }

        if (Object.keys(finalStyle).length) {
          wrapperAttrs.style = Object.entries(finalStyle).map(([k, v]) => `${k}:${v}`).join(";");
        }

        const containerCls = ['flex flex-col flex-1 w-full', definition.containerClassName, variantContainerCls, mergedArgs.className].filter(Boolean).join(" ");
        // 只對容器元件過濾 prop，避免 href/title/stripe 等洩漏到內部 div。
        // 其他 fallback（如圖示、圖片）需完整保留參數才能正常運作。
        const fromCube = definition.from ?? "";
        const fallbackArgs: Record<string, unknown> = {};
        if (fromCube === "方塊:方塊:容器") {
          const CONTAINER_KEYS = new Set(['color','active','activeStateName','hover','padding','width','height','style']);
          for (const k of CONTAINER_KEYS) {
            if (k in mergedArgs) fallbackArgs[k] = mergedArgs[k];
          }
          if (mergedArgs.disabled) fallbackArgs.active = false;
        } else {
          // 非容器元件（如圖示、圖片）完整透傳 runtime 參數
          Object.assign(fallbackArgs, mergedArgs);
        }

        // 動態 disabled（x-bind:disabled="locked"）→ Container 也需動態斷電
        // c-div-inactive[data-active="false"] 自帶灰階色，無需動 CSS 變數，只切 data-active 即可
        const dynDisabledExpr = wrapperAttrs["x-bind:disabled"];
        if (dynDisabledExpr && dynDisabledExpr !== "true" && dynDisabledExpr !== "false") {
          const patchExpr = `let _d=(${dynDisabledExpr});$el.style.cursor=_d?'default':'';const _a=$el.querySelector('[data-active]');if(_a)_a.setAttribute('data-active',_d?'false':'true')`;
          wrapperAttrs["x-effect"] = wrapperAttrs["x-effect"]
            ? `${wrapperAttrs["x-effect"]}; ${patchExpr}`
            : patchExpr;
        }

        const result = fallbackFn({ ...fallbackArgs, context, children: childrenProp, className: containerCls });
        return jsx(wrapperTag, { ...wrapperAttrs, children: result });
      }

      const result = fallbackFn({ ...mergedArgs, context, children: childrenProp, className: cubeClassName });
      return result;
    }
    return <div class="cube-reference" data-cube-id={from}>未知方塊: {from}</div>;
  }

  // ── 以下為原生標籤渲染 ──

  // 組裝屬性（型別 any 以相容 JSX 布林值）
  const attrs: Record<string, any> = {};

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

  if (Object.keys(finalOn).length > 0) {
    for (const [key, value] of Object.entries(finalOn)) {
      attrs[`x-on:${key}`] = substitute(value, mergedArgs);
    }
  }
  if (Object.keys(finalData).length > 0) {
    for (const [key, value] of Object.entries(finalData)) {
      attrs[`data-${key}`] = substitute(value, mergedArgs);
    }
  }

  // [原生標籤短路徑] 透傳 runtime 參數（如 placeholder, src, alt, required, disabled…）
  // 當 from 是原生標籤時，definition.args 為空，必須從 mergedArgs 補回屬性。
  const NATIVE_RESERVED = new Set(['className','style','context','children','definition','from','args','depth','fallbacks','slots']);
  for (const [k, v] of Object.entries(mergedArgs)) {
    if (
      typeof k === "string" &&
      !k.startsWith("x-") && !k.startsWith("@") && !k.startsWith("data-") &&
      !NATIVE_RESERVED.has(k) && !(k in attrs) &&
      (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    ) {
      if (isAttrAllowed(from, k)) {
        attrs[k] = v;
      }
    }
  }

  // args → HTML 屬性（string 型別的 arg 直接輸出為 HTML 屬性，如 viewBox、xmlns）
  // 依 from 白名單過濾，防止 <div href="/about"> 等非法屬性
  if (definition.args) {
    for (const [key, argDef] of Object.entries(definition.args)) {
      if (argDef.type === "string" && mergedArgs[key] !== undefined && mergedArgs[key] !== null) {
        if (isAttrAllowed(from, key)) {
          attrs[key] = substitute(String(mergedArgs[key]), mergedArgs);
        }
      }
    }
  }

  // ── Void element ──
  if (isVoidElement(from)) {
    return jsx(from, { style: finalStyle, class: finalClassName, ...attrs });
  }

  // ── 最終渲染 ──
  // 🛡️ 核心安全性修正：將 childrenProp 澈底打平成一維陣列
  // 防止像 Template 展開後產生的 [ [VNode, VNode] ] 結構觸發 processChildren 的 [object Object] 轉字串 Bug
  const flatChildrenProp = Array.isArray(childrenProp)
    ? childrenProp.flat(Infinity)
    : [childrenProp];

  const processed = processChildren(flatChildrenProp, { ...mergedArgs, context } as Record<string, unknown>);
  const nativeChildren = processed.length === 1 ? processed[0] : processed;
  return jsx(from, {
    style: finalStyle,
    class: finalClassName,
    ...attrs,
    children: nativeChildren,
  });
}