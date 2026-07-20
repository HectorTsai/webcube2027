// pipelines/renderPipeline.ts — 子節點遞迴渲染管線 (v4 純Children版)
// 職責：遍歷 children 並遞迴調用 Cube，處理 repeat 迴圈展開。
//      支援 $$CHILDREN$$ 標記：將父層傳入的 jsxChildren 注入指定位置。
//
// 🗑️ v4 移除：slot 插槽系統（解析/預插值/合併/env.slots 穿透）全部廢除
//           prepend/append 特殊欄位全部廢除

import { jsx, Fragment } from "hono/jsx/jsx-runtime";
import { Children } from "hono/jsx";
import { raw } from "hono/html";
import type { Context } from "hono";
import { 智慧插值 } from "../../utils/安全過濾器.ts";
import type { CubeEnv } from "./argsPipeline.ts";
import { 結構鍵, 清洗子級環境, 提取子覆寫 } from "./childPipeline.ts";
import { warn } from "../../utils/logger.ts";
import Cube from "../方塊.tsx";

/** 預插值最大遞迴深度（與 方塊.tsx 的 MAX_DEPTH 對齊） */
const 預插值最大深度 = 50;

/**
 * 預插值子定義（入口：一次性快速跳過 + 遞迴處理）
 * 僅在入口進行一次 JSON.stringify 掃描，若全樹不含 { 則直接返回，
 * 避免對巨型靜態 JSON 的每個節點重複執行 stringify。
 */
function 預插值子定義(def: any, args: Record<string, unknown>): any {
  // 🏎️ 快速通道：null / undefined / 純值直接回傳
  if (def === null || def === undefined) return def;
  if (typeof def === "string") return def.includes("{") ? 智慧插值(def, args) : def;
  if (Array.isArray(def) || (typeof def === "object" && !("type" in def))) {
    try {
      if (!JSON.stringify(def).includes("{")) return def;
    } catch { /* 環狀參照 → 放行遞迴處理 */ }
  }
  return 預插值遞迴(def, args, 0);
}

/** 內部遞迴：不重複執行 stringify，僅做深度受限的模板替換 */
function 預插值遞迴(def: any, args: Record<string, unknown>, depth: number): any {
  if (depth > 預插值最大深度) return def;
  // 🛡️ null / undefined / 純值快速退出（typeof null === "object" 故需顯式攔截）
  if (def === null || def === undefined) return def;
  if (typeof def === "string") return 智慧插值(def, args);
  if (Array.isArray(def)) return def.map(d => 預插值遞迴(d, args, depth + 1));
  if (typeof def !== "object" || "type" in def) return def;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(def)) {
    out[k] = (k === "children" && typeof v === "string" && 是子項巨集(v)) ? v : 預插值遞迴(v, args, depth + 1);
  }
  return out;
}

// ── Hono VNode 檢測 ──
// Hono JSX 的 VNode 格式為 { tag, props, children? }，無 React 的 type 屬性。
// 此輔助函數用於區分 Hono 原生 VNode（tag 為字串的原生 HTML/SVG 元素或 Fragment）
// 與 Cube 定義物件（含 from 等結構鍵）。
function 是HonoVNode(v: unknown): boolean {
  if (v === null || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  // 有 from 鍵 → 是 Cube 定義而非 VNode
  if (obj.from) return false;
  // 原生 HTML/SVG 元素：tag 為字串（如 "div"、"path"）
  if (typeof obj.tag === "string") return true;
  // Fragment VNode：tag 為 Fragment 函數
  if (obj.tag === Fragment) return true;
  // 元件 VNode（如 Cube）：tag 為 JSX 元件函數
  // 出現在 JSX children 中傳入的 <Cube> 標籤
  if (typeof obj.tag === "function") return true;
  return false;
}

// ── 安全深拷貝（切斷記憶體鏈路，防止下游管線平行修改導致跨節點污染）──
function 安全深拷貝<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if ("type" in (obj as Record<string, unknown>)) return obj;
  if (Array.isArray(obj)) return obj.map(item => 安全深拷貝(item)) as unknown as T;
  const clone = {} as Record<string, unknown>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === "context" || key === "env") clone[key] = (obj as Record<string, unknown>)[key];
      else clone[key] = 安全深拷貝((obj as Record<string, unknown>)[key]);
    }
  }
  return clone as unknown as T;
}

// ── 遞迴蒐集模板鍵 ──
function 蒐集模板鍵(obj: unknown, bucket: Set<string>): void {
  if (typeof obj === "string") {
    for (const m of obj.matchAll(/\{([\w\-.\u4e00-\u9fff]+)\}/g)) {
      bucket.add(m[1].split(".")[0]);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) 蒐集模板鍵(item, bucket);
  } else if (obj !== null && typeof obj === "object" && !("type" in (obj as Record<string, unknown>))) {
    for (const v of Object.values(obj as Record<string, unknown>)) 蒐集模板鍵(v, bucket);
  }
}

/** 判斷字串是否為 $$ 子項分配巨集 */
function 是子項巨集(s: string): boolean {
  return /^\$\$(?:CHILDREN(?:_\d+(?:_\d+|END)?)?|FIRST_CHILD|FIRST_IMAGE_CHILD|REST_CHILDREN|LAST_CHILD|CHILD_\d+)\$\$$/.test(s);
}

/** 判斷 VNode 是否為圖片（原生 <img> 或 Cube 圖片方塊） */
function 是圖片VNode(v: any): boolean {
  if (!v || typeof v !== "object") return false;
  // 原生 <img>
  if (v.tag === "img") return true;
  // Cube 元件 with from="方塊:方塊:圖片"
  const from = v.props?.definition?.from || v.props?.from || "";
  if (typeof from === "string" && from.includes("圖片")) return true;
  return false;
}

/** 解析 $$CHILDREN$$ 切片標記
 *  語義別名：
 *  - $$CHILDREN$$          → undefined（全部）
 *  - $$FIRST_CHILD$$       → [0, 1]（僅第 1 個子項）
 *  - $$REST_CHILDREN$$     → [1, undefined]（第 1 個以後全部）
 *  - $$LAST_CHILD$$        → [-1, undefined]（僅最後 1 個）
 *  - $$CHILD_N$$           → [N, N+1]（第 N 個子項，0-based）
 *  數字切片（向後相容）：
 *  - $$CHILDREN_3$$        → [3, 4]（單個子項，第4個）
 *  - $$CHILDREN_1_END$$    → [1, undefined]（從第2個到結尾）
 *  - $$CHILDREN_0_2$$      → [0, 2]（前兩個）
 */
function 解析子項切片(marker: string): [number, number | undefined] | undefined {
  // 語義別名
  if (marker === "$$CHILDREN$$") return undefined;
  if (marker === "$$FIRST_CHILD$$") return [0, 1];
  if (marker === "$$FIRST_IMAGE_CHILD$$") return [-2, 0]; // sentinel：由 map handler 特殊處理
  if (marker === "$$REST_CHILDREN$$") return [1, undefined];
  if (marker === "$$LAST_CHILD$$") return [-1, undefined];

  // $$CHILD_N$$ 單個子項
  const singleMatch = marker.match(/^\$\$CHILD_(\d+)\$\$$/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1]);
    return [n, n + 1];
  }

  // $$CHILDREN_N_M$$ 數字切片（保留向後相容）
  const match = marker.match(/^\$\$CHILDREN_(\d+)(?:_(\d+|END))?\$\$$/);
  if (!match) return undefined;
  const start = parseInt(match[1]);
  if (!match[2]) return [start, start + 1];          // $$CHILDREN_N$$
  if (match[2] === "END") return [start, undefined];  // $$CHILDREN_N_END$$
  return [start, parseInt(match[2])];                  // $$CHILDREN_N_M$$
}

/**
 * 根據切片規格從 userChildren 中取出子項
 */
function 取子項切片(hasUserChildren: boolean, userChildren: any[], slice?: [number, number | undefined]): any[] {
  if (!hasUserChildren || userChildren.length === 0) return [];
  if (slice === undefined) return userChildren;
  const [start, end] = slice;
  if (end === undefined) return userChildren.slice(start);
  return userChildren.slice(start, end);
}

export interface 子節點結果 {
  最終子節點: any;
  延伸環境: CubeEnv;
}

/**
 * 處理子節點 — 純 children 遞迴渲染
 * 支援 $$CHILDREN$$：子定義中 children 值為 "$$CHILDREN$$" 時，注入父層傳入的 jsxChildren。
 */
export async function 處理子節點(
  definition: any,
  jsxChildren: unknown,
  localArgs: Record<string, unknown>,
  env: CubeEnv,
  context: Context | undefined,
  depth: number,
): Promise<子節點結果> {
  // ── 解析 JSX children（父層傳入的 VNode）──
  let userChildren: any[] = [];
  if (jsxChildren !== undefined) {
    const arr = Children.toArray(jsxChildren as any) as unknown[];
    const flat = arr.flat(Infinity) as unknown[];
    userChildren = flat.filter((c: any) => c !== null && c !== undefined);
  }

  // ── 合併 children：definition.children 為主，$$CHILDREN$$ 注入 userChildren ──
  let jsonChildren: any[] = [];
  const hasUserChildren = userChildren.length > 0;

  if (definition.children) {
    const rawChildren = Array.isArray(definition.children) ? definition.children : [definition.children];
    for (const child of rawChildren) {
      if (typeof child === "string" && 是子項巨集(child)) {
        // 🔵 獨立 $$CHILDREN$$ 系列標記（children 陣列中的字串項目）
        //    按切片規格注入 userChildren
        const slice = 解析子項切片(child);
        const items = 取子項切片(hasUserChildren, userChildren, slice);
        for (const uc of items) {
          if (uc && typeof uc === "object" && !("type" in uc)) {
            jsonChildren.push(預插值子定義(uc, localArgs));
          } else {
            jsonChildren.push(uc);
          }
        }
      } else if (typeof child === "string") {
        // 🔵 純字串 child（text fallback），僅在無 userChildren 時保留
        if (!hasUserChildren) jsonChildren.push(child);
      } else {
        // 🔵 巢狀 $$CHILDREN$$：若子物件的 children 欄位值為 "$$CHILDREN$$"
        //    且存在 userChildren，則標記該子物件需要以 props.children 接收 userChildren。
        //    此模式用於卡片等固定結構方塊：外層定義兩個 div（media + body），
        //    body div 的 children 設為 "$$CHILDREN$$" 以接收使用者的 JSX 內容。
        //    ⚠️ 不能直接把 VNode 塞進 definition.children，因為 VNode 的 tag 是
        //    函數（Cube 元件），會被 renderPipeline 誤判而無法正確渲染。
        const clonedChild = 安全深拷貝(child);
        if (hasUserChildren && clonedChild && typeof clonedChild === "object" && typeof clonedChild.children === "string" && 是子項巨集(clonedChild.children)) {
          const slice = 解析子項切片(clonedChild.children);
          clonedChild.__needsUserChildren = true;
          clonedChild.__userChildrenSlice = slice;
          clonedChild.__userChildrenMacro = clonedChild.children; // 保留原始巨集字串
          delete clonedChild.children;
        }
        jsonChildren.push(clonedChild);
      }
    }
  } else if (hasUserChildren) {
    // 🔵 無 definition.children 但有 userChildren → 直接使用 userChildren
    jsonChildren = userChildren;
  }

  // ── 掃描模板鍵（供白名單穿透）──
  const 模板穿透键 = new Set<string>();
  for (const child of jsonChildren) {
    if (typeof child === "object") 蒐集模板鍵(child, 模板穿透键);
  }

  // ── 清洗子級環境 ──
  const 子資料 = 清洗子級環境(localArgs, {}, 模板穿透键.size > 0 ? 模板穿透键 : undefined);

  // 🔵 $$FIRST_IMAGE_CHILD$$ 消耗索引追蹤：記錄已被 $$FIRST_IMAGE_CHILD$$ 取走的子項
  const __consumedIndices = new Set<number>();
  const 有首圖巨集 = Array.isArray(definition.children) &&
    definition.children.some((c: any) => typeof c?.children === "string" && c.children === "$$FIRST_IMAGE_CHILD$$");

  // ── 渲染每個子節點 ──
  const rendered = (await Promise.all(
    jsonChildren.map(async (child: any) => {
      // 字串 → 插值
      if (typeof child === "string") return 智慧插值(child, 子資料);

      // VNode 穿透（Hono 原生格式：{ tag, props }，無 React type）
      // 🚀 原生 HTML 元素（tag 為字串如 "div"、"img"）直接穿透，Hono 能正確渲染
      if (是HonoVNode(child) && typeof (child as any).tag === "string") return child;
      // 🚀 元件 VNode（tag 為函數如 Cube）：解構 props 後顯式調用 Cube，
      //    確保 className、style 等 props 正確傳遞到 Cube 內部 argsPipeline
      if (是HonoVNode(child) && typeof (child as any).tag === "function") {
        const childProps = (child as any).props || {};
        // Hono VNode 的 children 在 props.children 內，不應從頂層 .children 提取（永遠為 undefined），
        // 否則 children: vnodeChildren 會覆蓋 childProps.children 導致子內容全部丟失
        return jsx(Cube, { ...childProps, env, context, depth: depth + 1 });
      }

      // 空白/非物件
      if (!child || typeof child !== "object") return child;

      // if 條件
      if (child.if !== undefined) {
        const ifRaw = 智慧插值(String(child.if), 子資料);
        const negate = String(ifRaw).startsWith("!");
        const val = negate ? String(ifRaw).slice(1) : String(ifRaw);
        // 未解析模板（仍含 {}）→ 視為 falsy，其餘以 JS 標準真假值判定
        const 未解析 = typeof val === "string" && val.includes("{") && val.includes("}");
        const truthy = 未解析 ? false : !!val;
        if (negate ? truthy : !truthy) return null;
      }

      // raw
      if (child.raw !== undefined) {
        const content = 智慧插值(child.raw, 子資料) || "";
        return content ? raw(String(content)) : null;
      }

      // 無 from 有 tag → 直接遞迴
      if (!child.from && child.tag) {
        return jsx(Cube, { definition: child, args: { ...子資料 }, env, context, depth: depth + 1 });
      }

      // 無 from 無 tag → 插值字串
      if (!child.from) return typeof child === "string" ? 智慧插值(child, 子資料) : null;

      // 標準 Cube 遞迴
      const needsUC = child.__needsUserChildren === true;
      const 清洗子定義 = { ...child };
      delete 清洗子定義.__needsUserChildren;
      delete 清洗子定義.__userChildrenSlice;
      delete 清洗子定義.__userChildrenMacro;
      const 原始覆寫 = 提取子覆寫(清洗子定義);
      for (const [k, v] of Object.entries(原始覆寫)) {
        if (typeof v === "string" && /^\{[\w\-.]+\}$/.test(v)) {
          const resolved = 智慧插值(v, 子資料);
          if (typeof resolved === "string" && resolved !== v) 原始覆寫[k] = resolved;
        }
      }

      for (const [k, v] of Object.entries(清洗子定義)) {
        if (!結構鍵.has(k.toLowerCase()) && typeof v === "string" && /^\{[\w\-.]+\}$/.test(v)) {
          delete 清洗子定義[k];
        }
      }

      // 🔵 $$FIRST_IMAGE_CHILD$$ 特殊處理：掃描 userChildren 找首張圖片
      if (child.__userChildrenMacro === "$$FIRST_IMAGE_CHILD$$" && hasUserChildren) {
        const idx = userChildren.findIndex(是圖片VNode);
        if (idx >= 0) {
          __consumedIndices.add(idx);
          return jsx(Cube, {
            definition: 清洗子定義,
            args: { ...子資料, ...原始覆寫 },
            children: [userChildren[idx]],
            env,
            context,
            depth: depth + 1,
          });
        }
        // 無圖片 → 不回傳任何內容（media div 留空）
        return null;
      }

      // 🔵 $$REST_CHILDREN$$ 消耗感知：若有首圖巨集存在，改為扣除已消耗（無消耗 = 全部保留）
      const slice = child.__userChildrenSlice;
      let ucChildren: any[];
      if (child.__userChildrenMacro === "$$REST_CHILDREN$$" && 有首圖巨集) {
        ucChildren = userChildren.filter((_, i) => !__consumedIndices.has(i));
      } else {
        ucChildren = 取子項切片(hasUserChildren, userChildren, slice);
      }

      return jsx(Cube, {
        definition: 清洗子定義,
        args: { ...子資料, ...原始覆寫 },
        ...(needsUC ? { children: ucChildren } : {}),
        env,
        context,
        depth: depth + 1,
      });
    }),
  )).filter((c: any) => c !== null && c !== undefined && c !== "");

  // ── 扁平化 Fragment ──
  const flattened = rendered.flatMap((item: any) => {
    if (是HonoVNode(item) && item.tag === Fragment) {
      const fc = item.props?.children;
      return Array.isArray(fc) ? fc : [fc];
    }
    return [item];
  }).filter((c: any) => c !== null && c !== undefined && c !== "");

  const finalChildren = flattened.length === 1 ? flattened[0] : (flattened.length > 0 ? flattened : undefined);

  // 🔴 text-only 方塊不在此處回傳文字（避免與 方塊.tsx 的 hasText 分支重複渲染）
  if (finalChildren !== undefined) {
    return { 最終子節點: finalChildren, 延伸環境: env };
  }
  return { 最終子節點: undefined, 延伸環境: env };
}

/**
 * 處理 repeat 迴圈展開
 */
export async function 處理Repeat展開(
  definition: any,
  localArgs: Record<string, unknown>,
  env: CubeEnv,
  context: Context | undefined,
  depth: number,
): Promise<any> {
  const dataKeyRaw = typeof definition.repeat === "string" ? definition.repeat : definition.repeat.data;
  let dataKey = typeof dataKeyRaw === "string" ? dataKeyRaw : String(dataKeyRaw);
  if (dataKey.startsWith("{") && dataKey.endsWith("}")) dataKey = dataKey.slice(1, -1);
  const repeatData = localArgs[dataKey];
  if (repeatData === undefined) {
    warn("處理Repeat展開", `[Repeat] 資料源「${dataKey}」不存在，回傳空白`);
    return jsx(Fragment, { children: [] });
  }
  if (!Array.isArray(repeatData)) {
    return jsx("div", { class: "cube-error", children: `Repeat 資料源非陣列: ${dataKey}` });
  }

  const 淨化Env = 清洗子級環境(env as Record<string, unknown>, {}) as CubeEnv;
  const parentInstancePath = env.__cube_instance_path || "root";
  const 清潔Args = { ...localArgs };
  delete 清潔Args[dataKey];

  if (repeatData.length > 50) {
    warn("處理Repeat展開", `資料源「${dataKey}」含有 ${repeatData.length} 項，可能造成記憶體壓力`);
  }

  const results = await Promise.all(
    repeatData.map((item: any, index: number) => {
      // 淺拷貝即足夠：Wave 3 管線對 definition 唯讀，僅需刪除頂層 repeat 欄位
      const 隔離Def = { ...definition };
      delete 隔離Def.repeat;
      const 子項路徑 = `${parentInstancePath}_${index}`;
      return jsx(Cube, {
        definition: 隔離Def,
        context,
        args: { ...清潔Args, item, index, ...(typeof item === "object" ? item : {}) },
        env: { ...淨化Env, __cube_instance_path: 子項路徑 },
        depth: depth + 1,
      });
    }),
  );

  return jsx(Fragment, { children: results });
}
