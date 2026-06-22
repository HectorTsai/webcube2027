// 圖片.tsx (2026 新版 — 方塊:方塊:圖片 fallback)
// id 模式：從 /media/v1/image/{id} 抓圖片
// src 模式：直接用 src
// 皆渲染原生 <img>
import { jsx } from "hono/jsx/jsx-runtime";
import type { Context } from "hono";

export default async function 圖片(props: Record<string, unknown>) {
  const {
    children, context, id, src,
    alt = "Image", width, height,
    loading = "lazy", objectFit = "cover",
    className, color: _color, padding: _pad, gap: _gap, 
    drawerState: _ds, active: _act, hover: _hov, disabled: _dis,
    style: _sty, ...rest
  } = props;

  const imgStyle: Record<string, string> = {
    maxWidth: "100%",
    objectFit: (objectFit as string) || "cover",
  };
  // 只在明確傳入 width/height 時才設 style，避免覆蓋 className（如 w-full h-48）
  if (width) imgStyle.width = String(width);
  if (height) imgStyle.height = String(height);

  const imgProps: Record<string, unknown> = {
    alt, loading, className: className || "image",
    style: imgStyle,
    ...rest,
  };

  if (width) imgProps.width = width;
  if (height) imgProps.height = height;

  // 有 src 直接用
  if (src) {
    imgProps.src = src;
    return jsx("img", imgProps);
  }

  // 有 id + context → 從 media API 載入
  if (id) {
    imgProps.src = `/media/v1/image/${id}`;
    return jsx("img", imgProps);
  }

  // fallback placeholder
  return jsx("div", {
    class: `image ${className || ""}`,
    style: {
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "#e5e7eb", borderRadius: "4px",
      maxWidth: "100%", height: height || "auto", width: width || "auto",
    },
  });
}
