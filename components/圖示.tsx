// 圖示.tsx (2026 新版 — 方塊:方塊:圖示 fallback)
// id 模式：從 /medias/icon/{id} 抓 SVG，抽取外層屬性為預設值，args 可覆蓋
// 無 id 模式：用 definition.children 靜態渲染 SVG
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

export default async function 圖示(props: Record<string, unknown>) {
  const {
    children, context, id,
    xmlns: argXmlns, viewBox: argViewBox,
    fill: argFill, stroke: argStroke,
    strokeWidth: argStrokeWidth, strokeLinecap: argStrokeLinecap, strokeLinejoin: argStrokeLinejoin,
    size = "md", className, ...rest
  } = props;

  const sizeClass = sizeClasses[size as string] || sizeClasses.md;

  // 有 id + context → 從資料庫載入 SVG
  if (id && context) {
    try {
      const res = await InnerAPI(context as Context, `/medias/icon/${id}`);
      if (res.ok) {
        const svgText = await res.text();
        if (svgText.trim().startsWith("<svg")) {
          // 抽出 DB SVG 的外層屬性當預設值
          const dbAttrs = parseSvgAttrs(svgText);
          // 只取 inner content（path 等）
          const m = svgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
          const innerHtml = m ? m[1].trim() : "";

          return jsx("svg", {
            xmlns: argXmlns || dbAttrs.xmlns || "http://www.w3.org/2000/svg",
            viewBox: argViewBox || dbAttrs.viewBox || "0 0 24 24",
            fill: argFill || dbAttrs.fill || "none",
            stroke: argStroke || dbAttrs.stroke || "currentColor",
            "stroke-width": argStrokeWidth || dbAttrs["stroke-width"] || "2",
            "stroke-linecap": argStrokeLinecap || dbAttrs["stroke-linecap"] || "round",
            "stroke-linejoin": argStrokeLinejoin || dbAttrs["stroke-linejoin"] || "round",
            class: className ? `${sizeClass} ${className}` : sizeClass,
            ...rest,
            children: raw(innerHtml),
          });
        }
      }
    } catch { /* fallback */ }
  }

  // 靜態模式：用 args 預設值 + children
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
