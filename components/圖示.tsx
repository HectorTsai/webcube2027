// 圖示.tsx (2026 新版 — 方塊:方塊:圖示 fallback)
// id 模式：從 /media/v1/icon/{id} 抓 SVG，抽取外層屬性為預設值，args 可覆蓋
// 無 id 但有 context：透過 系統資訊 → 骨架 → 骨架.選單按鈕 取得預設圖示
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

/** 透過 context 取得系統骨架的選單按鈕圖示 ID（預設 "圖示:圖示:選單"） */
async function 取得預設圖示ID(context: Context): Promise<string | null> {
  try {
    const 系統資訊 = context.get('系統資訊') as Record<string, unknown> | null;
    const 骨架ID = 系統資訊?.骨架 as string;
    if (!骨架ID) return null;
    const res = await InnerAPI(context, `/api/v1/cubes/${骨架ID}`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data?.data?.選單按鈕 || "圖示:圖示:選單";
  } catch {
    return "圖示:圖示:選單";
  }
}

/** 從 media API 載入 SVG 並渲染 */
async function 渲染SVG(props: Record<string, unknown>, iconId: string) {
  const {
    children: _children, context: _context, id: _id,
    xmlns: argXmlns, viewBox: argViewBox,
    fill: argFill, stroke: argStroke,
    strokeWidth: argStrokeWidth, strokeLinecap: argStrokeLinecap, strokeLinejoin: argStrokeLinejoin,
    size = "md", className, context, ...rest
  } = props;

  const sizeClass = sizeClasses[size as string] || sizeClasses.md;
  const res = await InnerAPI(context as Context, `/media/v1/icon/${iconId}`);
  if (res.ok) {
    const svgText = await res.text();
    if (svgText.trim().startsWith("<svg")) {
      const dbAttrs = parseSvgAttrs(svgText);
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
  return null; // 載入失敗，呼叫端 fallback
}

export default async function 圖示(props: Record<string, unknown>) {
  const { children, context, id } = props;

  // 有 context + 明確 id → 走 media API 載入
  if (id && context) {
    const svg = await 渲染SVG(props, id as string);
    if (svg) return svg;
  }

  // 無 id 但有 context → 從骨架取得選單按鈕圖示
  if (!id && context) {
    const 預設ID = await 取得預設圖示ID(context as Context);
    if (預設ID) {
      const svg = await 渲染SVG(props, 預設ID);
      if (svg) return svg;
    }
  }

  // 最終 fallback：靜態模式用 children（或只是一個空 SVG shell）
  const {
    xmlns: argXmlns, viewBox: argViewBox,
    fill: argFill, stroke: argStroke,
    strokeWidth: argStrokeWidth, strokeLinecap: argStrokeLinecap, strokeLinejoin: argStrokeLinejoin,
    size = "md", className, ...rest
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
