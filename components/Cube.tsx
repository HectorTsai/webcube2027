// Cube.tsx (2026 統一方塊渲染器)
// 接收 方塊定義 JSON，渲染出對應的 HTML 元素。
//
// 設計原則：
//   - 通用渲染器，不包含特定元件的業務邏輯
//   - from 為原生標籤 → 依照定義的 style/className/children 渲染
//   - from 為方塊 ID 且註冊了 fallback → 委派給 fallback 元件
//   - from 為方塊 ID 但無 fallback → 顯示佔位
//
// 支援：
//   - args: 參數合併 + style {argName} 模板替代
//   - alpine: x-init, x-bind, x-model
//   - on: x-on:click, x-on:input ...
//   - data: data-* 屬性 (支援 {argName} 模板)
//   - slots / children: 遞迴渲染
//   - text: 文字節點
//   - depth 上限 10 層防循環
import { processChildren } from "./index.ts";
import { jsx } from "hono/jsx/jsx-runtime";
import { Context } from "hono";
import { InnerAPI } from "../services/index.ts";
import 方塊 from "../database/models/方塊.ts";
import Container from "./Container.tsx";

// ---------- 全域 fallback 註冊表 ----------
// 方塊 ID → FallbackComponent。使用者可透過 registerFallback() 註冊自訂方塊，
// 之後使用 <Cube definition={...}> 時不需再傳 fallbacks prop。
//
// 註冊的 fallback 可以被 props.fallbacks 覆蓋，方便測試或臨時替換。

const fallbackRegistry: Record<string, FallbackComponent> = {};

export function registerFallback(id: string, component: FallbackComponent): void {
  fallbackRegistry[id] = component;
}

// 註冊內建元件
registerFallback("方塊:方塊:Container", (props: Record<string, unknown>) => {
  const { children, context: _context, width, height, ...containerProps } = props;
  const containerStyle: Record<string, string> = {};
  if (width) containerStyle.width = width as string;
  if (height) containerStyle.height = height as string;
  return (
    <Container {...containerProps} width={width as string} height={height as string} style={containerStyle}>
      {children}
    </Container>
  );
});

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
  /** 直接傳入方塊定義（靜態用法） */
  definition?: Partial<方塊>;
  /** 從資料庫載入方塊定義的 ID（與 definition 二選一） */
  cubeId?: string;
  /** Hono Context — 使用 cubeId 時需要 */
  c?: Context;
  /** 執行時期參數，會合併到定義的預設 args 上（與直接 prop 寫法二選一） */
  args?: Record<string, unknown>;
  /** 遞迴深度（內部使用） */
  depth?: number;
  /** context 穿透 */
  context?: Record<string, unknown>;
  /** 方塊 ID → fallback 元件的映射 */
  fallbacks?: Record<string, FallbackComponent>;
  /** JSX 子節點 — 當使用 <Cube>...</Cube> 語法時自動傳入 */
  children?: unknown;
  /** 其餘 prop 會自動被當成 args 合併 */
  [key: string]: unknown;
}

// ---------- 渲染 children 的共用邏輯 ----------
function renderCubeChildren(
  definition: Partial<方塊>,
  mergedArgs: Record<string, unknown>,
  depth: number,
  context: Record<string, unknown> | undefined,
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

// ---------- Cube 元件 ----------
export default async function Cube(props: CubeProps): Promise<any> {
  const { definition: staticDefinition, cubeId, c, args: runtimeArgs = {}, depth = 0, context, fallbacks, children: jsxChildren, ...restArgs } = props;

  // ── 深度上限 ──
  if (depth > 10) return null;

  // ── 解析 definition（靜態傳入 vs 從資料庫載入）──
  let definition = staticDefinition;
  if (!definition && cubeId) {
    if (!c) {
      return <div class="cube-error">Cube: 使用 cubeId 時需要傳入 c（Hono Context）</div>;
    }
    try {
      const response = await InnerAPI(c, `/api/v1/cube/${encodeURIComponent(cubeId)}`);
      const result = await response.json();
      if (result.success && result.data) {
        const model = new 方塊(result.data);
        definition = model;
      } else {
        return <div class="cube-error">Cube: 找不到方塊 {cubeId}</div>;
      }
    } catch (_err) {
      return <div class="cube-error">Cube: 載入方塊 {cubeId} 失敗</div>;
    }
  }
  if (!definition) {
    return <div class="cube-error">Cube: 需要 definition 或 cubeId</div>;
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

  // ── 決定 children（JSX 優先，否則從 definition 取得）──
  const childrenNodes: unknown[] = jsxChildren !== undefined
    ? (Array.isArray(jsxChildren) ? jsxChildren : [jsxChildren])
    : renderCubeChildren(definition, mergedArgs, depth, context);
  const childrenProp = childrenNodes.length === 1 ? childrenNodes[0] : childrenNodes;

  // ── 解析 from ──
  const from = definition.from ?? "";
  const isNative = isNativeTag(from);

  if (!isNative) {
    // 方塊 ID：檢查 props.fallbacks → 全域 registry → 顯示佔位
    const fallbackFn = fallbacks?.[from] ?? fallbackRegistry[from];
    if (fallbackFn) {
      // 不在此 processChildren — 讓 fallback 元件（如 Container.tsx）自己處理
      return fallbackFn({ ...mergedArgs, context, children: childrenProp });
    }
    return <div class="cube-reference" data-cube-id={from}>未知方塊: {from}</div>;
  }

  // ── 以下為原生標籤渲染 ──

  // 計算 style（模板替代）
  const finalStyle: Record<string, string> = {};
  if (definition.style) {
    for (const [key, value] of Object.entries(definition.style)) {
      finalStyle[key] = substitute(value, mergedArgs);
    }
  }

  // className
  const finalClassName = definition.className || "";

  // 組裝屬性
  const attrs: Record<string, string> = {};

  // alpine bind
  if (definition.alpine) {
    const bind = definition.alpine.bind as Record<string, string> | undefined;
    if (bind) {
      for (const [key, value] of Object.entries(bind)) {
        attrs[`x-bind:${key}`] = substitute(value, mergedArgs);
      }
    }
    const init = definition.alpine.init as string | undefined;
    if (init) {
      attrs["x-init"] = substitute(init, mergedArgs);
    }
    const model = definition.alpine.model as string | undefined;
    if (model) {
      attrs["x-model"] = substitute(model, mergedArgs);
    }
  }

  // events
  if (definition.on) {
    for (const [key, value] of Object.entries(definition.on)) {
      attrs[`x-on:${key}`] = value;
    }
  }

  // data attributes（通用機制，由方塊定義自行宣告）
  if (definition.data) {
    for (const [key, value] of Object.entries(definition.data)) {
      attrs[`data-${key}`] = substitute(value, mergedArgs);
    }
  }

  // ── Void element ──
  if (isVoidElement(from)) {
    return jsx(from, { style: finalStyle, class: finalClassName, ...attrs });
  }

  // ── 最終渲染 ──
  const processed = processChildren(Array.isArray(childrenProp) ? childrenProp : [childrenProp], { context });
  const nativeChildren = processed.length === 1 ? processed[0] : processed;
  return jsx(from, {
    style: finalStyle,
    class: finalClassName,
    ...attrs,
    children: nativeChildren,
  });
}