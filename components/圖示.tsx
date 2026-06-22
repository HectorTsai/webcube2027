// 圖示.tsx (2026 新版 — 方塊:方塊:圖示 fallback)
// id 模式：從 /media/v1/icon/{id} 抓 SVG，抽取外層屬性為預設值，args 可覆蓋
// 無 id 但有 context：走 mediaService，預設回傳 Logo（網站/系統商標）
// 無 id 無 context：用 children 靜態渲染 SVG
import { jsx } from "hono/jsx/jsx-runtime";
import { raw } from "hono/utils/html";
import { InnerAPI } from "../services/index.ts";
import type { Context } from "hono";

const sizeClasses: Record<string, string> = {
  xs: "w-4 h-4", sm: "w-5 h-5", md: "w-6 h-6", lg: "w-8 h-8",
  xl: "w-10 h-10", "2xl": "w-12 h-12", "3xl": "w-16 h-16", "4xl": "w-24 h-24",
};

/** 從 "<svg foo="bar" baz>..." 抽取屬性 map */
function parseSvgAttrs(svgText: string): Record<string, string> {
  const openTag = svgText.match(/<svg([^>]*)>/i);
  if (!openTag) return {};
  const attrs: Record<string, string> = {};
  const re = /(\w[\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(openTag[1])) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? "";
  }
  return attrs;
}

/** 從 media API 載入 SVG 並渲染 */
async function 渲染SVG(props: Record<string, unknown>, iconId?: string) {
  const {
    children: _children, context: _context, id: _id,
    xmlns: argXmlns, viewBox: argViewBox,
    fill: argFill, stroke: argStroke,
    strokeWidth: argStrokeWidth, strokeLinecap: argStrokeLinecap, strokeLinejoin: argStrokeLinejoin,
    size = "md", className, context, color, padding: _pad, width: _w, height: _h,
    gap: _gap, drawerState: _ds, active: _act, hover: _hov, activeStateName: _asn,
    style: _sty, disabled: _dis, ...rest
  } = props;

  const sizeClass = sizeClasses[size as string] || sizeClasses.md;
  const url = iconId ? `/media/v1/icon/${iconId}` : `/media/v1/icon`;
  const res = await InnerAPI(context as Context, url);
  if (res.ok) {
    const svgText = await res.text();
    if (svgText.trim().startsWith("<svg")) {
      const dbAttrs = parseSvgAttrs(svgText);
      const m = svgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
      const innerHtml = m ? m[1].trim() : "";

      // 只保留原始 SVG 有、或使用者明確指定的屬性；不硬加 fallback（避免覆蓋內部元素的自訂顏色）
      const resolve = (argVal: unknown, dbVal: string | undefined) =>
        (typeof argVal === 'string' ? argVal : undefined) ?? dbVal;

      return jsx("svg", {
        xmlns: argXmlns || dbAttrs.xmlns || "http://www.w3.org/2000/svg",
        viewBox: argViewBox || dbAttrs.viewBox || "0 0 24 24",
        fill: resolve(argFill, dbAttrs.fill),
        stroke: resolve(argStroke, dbAttrs.stroke),
        "stroke-width": resolve(argStrokeWidth, dbAttrs["stroke-width"]),
        "stroke-linecap": resolve(argStrokeLinecap, dbAttrs["stroke-linecap"]),
        "stroke-linejoin": resolve(argStrokeLinejoin, dbAttrs["stroke-linejoin"]),
        class: className ? `${sizeClass} ${className}` : sizeClass,
        ...rest,
        children: raw(innerHtml),
      });
    }
  }
  return null; // 載入失敗，呼叫端 fallback
}

export default async function 圖示(props: Record<string, unknown>) {
  const { children, context, id } = props;

  // 有 context → 走 media API 載入（無 id 時 mediaService 預設回傳 Logo）
  if (context) {
    const resolvedId = id ? String(id) : undefined;
    const svg = await 渲染SVG(props, resolvedId);
    if (svg) return svg;
  }

  // 最終 fallback：靜態模式用 children（或只是一個空 SVG shell）
  const {
    xmlns: argXmlns, viewBox: argViewBox,
    fill: argFill, stroke: argStroke,
    strokeWidth: argStrokeWidth, strokeLinecap: argStrokeLinecap, strokeLinejoin: argStrokeLinejoin,
    size = "md", className, context: _ctx, color: _color, padding: _pad, width: _w, height: _h,
    gap: _gap, drawerState: _ds, active: _act, hover: _hov, activeStateName: _asn,
    style: _sty, disabled: _dis, ...rest
  } = props;
  const sizeClass = sizeClasses[size as string] || sizeClasses.md;

  return jsx("svg", {
    xmlns: argXmlns || "http://www.w3.org/2000/svg",
    viewBox: argViewBox || "0 0 24 24",
    fill: argFill || "none",
    stroke: argStroke || "currentColor",
    "stroke-width": argStrokeWidth || "2",
    "stroke-linecap": argStrokeLinecap || "round",
    "stroke-linejoin": argStrokeLinejoin || "round",
    class: className ? `${sizeClass} ${className}` : sizeClass,
    ...rest,
    children,
  });
}
