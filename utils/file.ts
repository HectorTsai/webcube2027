export const 格式對應表 = {
  TEXT: { type: "text", mime: "text/plain" },
  JSON: { type: "text", mime: "application/json" },
  MARKDOWN: { type: "text", mime: "text/markdown" },
  SVG: { type: "text", mime: "image/svg+xml" },
  HTML: { type: "text", mime: "text/html" },
  BINARY: { type: "binary", mime: "application/octet-stream" },
  PNG: { type: "binary", mime: "image/png", magicNumbers: [[0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]] },
  JPG: { type: "binary", mime: "image/jpeg", magicNumbers: [[0, 0xFF, 0xD8, 0xFF]] },
  GIF: { type: "binary", mime: "image/gif", magicNumbers: [[0, 0x47, 0x49, 0x46, 0x38]] },
  WEBP: { type: "binary", mime: "image/webp", magicNumbers: [[0, 0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]] },
} as const;

export type 支援的格式 = keyof typeof 格式對應表;

export function 從ext取得格式(ext: string): { ext: 支援的格式; info: typeof 格式對應表[支援的格式] } | undefined {
  const upperExt = ext.toUpperCase() as 支援的格式;
  if (格式對應表[upperExt]) {
    return { ext: upperExt, info: 格式對應表[upperExt] };
  }
  return undefined;
}
