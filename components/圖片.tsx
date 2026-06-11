// 圖片.tsx (2026 新版 — 方塊:方塊:圖片 fallback)
// id 模式：從 /medias/image/{id} 抓圖片
// src 模式：直接用 src
// 皆渲染原生 <img>
import { jsx } from "hono/jsx/jsx-runtime";
import type { Context } from "hono";

export default async function 圖片(props: Record<string, unknown>) {
  const {
    children, context, id, src,
    alt = "Image", width, height,
    loading = "lazy", objectFit = "cover",
    className, ...rest
  } = props;

  const imgProps: Record<string, unknown> = {
    alt, loading, className: className || "image",
    style: {
      width: width || "auto",
      height: height || "auto",
      maxWidth: "100%",
      objectFit: objectFit || "cover",
    },
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
    imgProps.src = `/medias/image/${id}`;
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
