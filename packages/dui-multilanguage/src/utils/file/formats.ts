/**
 * 格式對應表：描述支援的內容格式、對應副檔名、MIME、類型與 magic numbers。
 */
export const 格式對應表 = {
  // 文字格式
  "TEXT": {
    type: "text",
    ext: "txt",
    mime: "text/plain",
    dir: ["docs"],
    magicNumbers: [],
  },
  "MARKDOWN": {
    type: "text",
    ext: "md",
    mime: "text/markdown",
    dir: ["docs"],
    magicNumbers: [],
  },
  "HTML": {
    type: "text",
    ext: "html",
    mime: "text/html",
    dir: ["docs"],
    magicNumbers: [],
  },
  "SVG": {
    type: "text",
    ext: "svg",
    mime: "image/svg+xml",
    dir: ["images"],
    magicNumbers: [],
  },
  "JSON": {
    type: "text",
    ext: "json",
    mime: "application/json",
    dir: ["library/defaults", "docs", "images"],
    magicNumbers: [],
  },
  // 二進位格式
  "PNG": {
    type: "binary",
    ext: "png",
    mime: "image/png",
    dir: ["images"],
    magicNumbers: [{
      offset: 0,
      bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    }],
  },
  "JPG": {
    type: "binary",
    ext: "jpg",
    mime: "image/jpeg",
    dir: ["images"],
    magicNumbers: [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  },
  "JPEG": {
    type: "binary",
    ext: "jpeg",
    mime: "image/jpeg",
    dir: ["images"],
    magicNumbers: [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  },
  "GIF": {
    type: "binary",
    ext: "gif",
    mime: "image/gif",
    dir: ["images"],
    magicNumbers: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  },
  "ICO": {
    type: "binary",
    ext: "ico",
    mime: "image/x-icon",
    dir: ["images"],
    magicNumbers: [{ offset: 0, bytes: [0x00, 0x00, 0x01, 0x00] }, {
      offset: 0,
      bytes: [0x00, 0x00, 0x02, 0x00],
    }],
  },
  "PDF": {
    type: "binary",
    ext: "pdf",
    mime: "application/pdf",
    dir: ["docs"],
    magicNumbers: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
  },
  "JP2": {
    type: "binary",
    ext: "jp2",
    mime: "image/jp2",
    dir: ["images"],
    magicNumbers: [{ offset: 4, bytes: [0x6A, 0x50, 0x20, 0x20] }, {
      offset: 0,
      bytes: [
        0x00,
        0x00,
        0x00,
        0x0C,
        0x6A,
        0x50,
        0x20,
        0x20,
        0x0D,
        0x0A,
        0x87,
        0x0A,
      ],
    }],
  },
  "WEBP": {
    type: "binary",
    ext: "webp",
    mime: "image/webp",
    dir: ["images"],
    magicNumbers: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, {
      offset: 0,
      bytes: [0x57, 0x45, 0x42, 0x50],
    }],
  },
  "BINARY": {
    type: "binary",
    ext: "bin",
    mime: "application/octet-stream",
    dir: ["downloads"],
    magicNumbers: [],
  },
} as const;

/** 支援的內容格式代碼（鍵為對應檔案格式名稱） */
export type SupportedFormat = keyof typeof 格式對應表;

/** 格式對應表的項目型別，描述副檔名、MIME、類型與 magic number 等資訊 */
export type FileMappingItem = typeof 格式對應表[SupportedFormat];

// 智慧內容介面定義
/**
 * 根據副檔名判斷內容格式。
 * @param ext 副檔名（不含點）
 * @returns 對應的格式代碼與資訊；若不支援則回傳 undefined。
 */
export function getFormatFromExt(
  ext: string,
): { ext: SupportedFormat; info: FileMappingItem } | undefined {
  const entry = Object.entries(格式對應表).find(([_, info]) =>
    (info as FileMappingItem).ext === ext
  );
  return entry ? { ext: entry[0] as SupportedFormat, info: entry[1] } : undefined;
}

/**
 * 根據 MIME 類型判斷內容格式。
 * @param mime MIME 類型字串
 * @returns 對應的格式代碼與資訊；若不支援則回傳 undefined。
 */
export function getFormatFromMime(
  mime: string,
): { ext: SupportedFormat; info: FileMappingItem } | undefined {
  const entry = Object.entries(格式對應表).find(([_, info]) =>
    (info as FileMappingItem).mime === mime
  );
  return entry ? { ext: entry[0] as SupportedFormat, info: entry[1] } : undefined;
}
