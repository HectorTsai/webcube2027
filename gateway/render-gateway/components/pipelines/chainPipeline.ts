// pipelines/chainPipeline.ts — 定義鏈路解析管線
// 職責：沿 from 鏈路往上合併多層定義（className / args / attrs / style / on / data / alpine / wrap），直到找到 tag。
// 死鐵律：只做定義合併，不碰數據請求、不碰渲染。
import type { Context } from "hono";
import { InnerAPI } from "../../services/index.ts";
import { 驗證完整性, 安全過濾Cube, 純模板正則 } from "../../utils/安全過濾器.ts";
import { warn } from "../../utils/logger.ts";
import { 安全合併Init } from "./alpinePipeline.ts";
import 方塊 from "../../database/models/方塊.ts";

// ── 載入方塊定義（含快取、安全驗證、Alpine 閘門）──
export async function 載入方塊定義(cubeId: string, c: Context): Promise<Partial<方塊> | null> {
  const cache = c.get?.("cube_def_cache") as Map<string, Partial<方塊> | null> | undefined;
  if (cache?.has(cubeId)) return cache.get(cubeId)!;

  try {
    const response = await InnerAPI(c, `/api/v1/cube/${cubeId}`);
    const result = await response.json();
    let def: Partial<方塊> | null = null;
    if (result.success && result.data) {
      const raw = result.data as Record<string, unknown>;
      const 已檢驗 = raw.已檢驗 as string | undefined;

      if (已檢驗) {
        const valid = await 驗證完整性(
          { from: raw.from, className: raw.className, style: raw.style, args: raw.args, children: raw.children, on: raw.on },
          已檢驗,
        );
        if (!valid) result.data = 安全過濾Cube(result.data);
      }

      const 可刪除 = raw.可刪除 as boolean | undefined;
      const 未審查 = !已檢驗;
      if (可刪除 !== false && 未審查) {
        delete result.data.alpine;
        delete result.data.on;
      }

      def = new 方塊(result.data) as Partial<方塊>;
    }
    // 🔴 宣告式全域 Store 收集：若方塊宣告了 declareStores，寫入頁面級收集桶
    if (def?.declareStores && Array.isArray(def.declareStores) && def.declareStores.length > 0) {
      let pageStores = c.get?.("page_required_stores") as Set<string> | undefined;
      if (!pageStores) {
        pageStores = new Set<string>();
        c.set?.("page_required_stores", pageStores);
      }
      for (const storeName of def.declareStores) pageStores.add(storeName);
    }
    if (!cache) c.set?.("cube_def_cache", new Map([[cubeId, def]]));
    else cache.set(cubeId, def);
    return def;
  } catch {
    return null;
  }
}

// ── 解析定義鏈路 ──
// 沿 from 鏈往上直到找到 tag（葉節點）。
// 回傳 { definition: 合併後的定義, resolvedTag: 最終標籤 } 或錯誤字串。
export async function 解析定義鏈路(
  from: string,
  currentDef: any,
  context: Context | undefined,
): Promise<{ definition: any; resolvedTag: string } | string> {
  if (!context) return "缺少 context";

  let resolvedTag: string | undefined = currentDef.tag;
  let accumulatedDef: any = { ...currentDef };
  let nextFrom: string | undefined = from;
  const visited = new Set<string>();

  while (nextFrom) {
    if (visited.has(nextFrom)) return `循環鏈路: ${[...visited, nextFrom].join(" → ")}`;
    visited.add(nextFrom);

    const parentDef = await 載入方塊定義(nextFrom, context);
    if (!parentDef) return `未知方塊: ${nextFrom}`;

    // 第一個 tag 勝出（currentDef.tag 優先，然後鏈路上的 def）
    if (!resolvedTag) resolvedTag = (parentDef as any).tag;

    // 累積合併（父在前，子在後覆蓋）
    accumulatedDef = {
      ...parentDef,
      ...accumulatedDef,
      tag: accumulatedDef.tag || (parentDef as any).tag,
      className: (() => {
        const isTemplate = (v: any) => typeof v === "string" && 純模板正則.test(v);
        const pClass = (parentDef as any).className;
        const aClass = accumulatedDef.className;
        return [isTemplate(pClass) ? "" : (pClass || ""), isTemplate(aClass) ? "" : (aClass || "")]
          .filter(Boolean).join(" ").trim();
      })(),
      args: (() => {
        const merged: Record<string, any> = { ...((parentDef as any).args || {}), ...(accumulatedDef.args || {}) };
        if (Object.keys(merged).length === 0) return undefined;
        for (const key of Object.keys(merged)) {
          if (key in (accumulatedDef.args || {}) && !merged[key].variants && (parentDef as any).args?.[key]?.variants) {
            merged[key] = { ...merged[key], variants: (parentDef as any).args[key].variants };
          }
        }
        return merged;
      })(),
      from: (parentDef as any).from || accumulatedDef.from,
      style: { ...((parentDef as any).style || {}), ...(accumulatedDef.style || {}) },
      attrs: { ...((parentDef as any).attrs || {}), ...(accumulatedDef.attrs || {}) },
      on: { ...((parentDef as any).on || {}), ...(accumulatedDef.on || {}) },
      data: { ...((parentDef as any).data || {}), ...(accumulatedDef.data || {}) },
      wrap: accumulatedDef.wrap || (parentDef as any).wrap,
      alpine: (parentDef as any).alpine || accumulatedDef.alpine
        ? {
            ...((parentDef as any).alpine || {}),
            ...(accumulatedDef.alpine || {}),
            // init 多層拼接：使用安全合併Init 防止註解結尾／無分號收尾導致的語法毀損
            init: 安全合併Init(
              ((parentDef as any).alpine as any)?.init,
              (accumulatedDef.alpine as any)?.init,
            ) || undefined,
            // bind 深層合併，確保父層事件綁定不丟失
            bind: {
              ...(((parentDef as any).alpine as any)?.bind || {}),
              ...((accumulatedDef.alpine as any)?.bind || {}),
            },
            attrs: {
              ...(((parentDef as any).alpine as any)?.attrs || {}),
              ...((accumulatedDef.alpine as any)?.attrs || {}),
            },
          }
        : undefined,
    };
    
    // 繼續沿鏈路往上（from 為空字串 = 終端方塊，無父層）
    nextFrom = (parentDef as any).from || undefined;
    // 安全防線：若 from 不含 ":"，必為原生標籤名誤植，中斷鏈路
    if (nextFrom && typeof nextFrom === "string" && !nextFrom.includes(":")) {
      await warn("Cube", `方塊鏈路遇到非 ID 的 from 值：「${nextFrom}」，已中斷。`);
      nextFrom = undefined;
    }
  }

  if (!resolvedTag) return `無效方塊，缺少 tag: ${from}`;

  return { definition: accumulatedDef, resolvedTag };
}
