/**
 * Uint8Array 工具函數
 *
 * 從 dui-multilanguage 移入 @dui/util/common，使用 @std/encoding/base64 標準編解碼。
 */

import { encodeBase64, decodeBase64 } from '@std/encoding/base64';

// ── Hex Look-up Table (256 entries, 避免 per-byte toString/padStart 開銷) ──

const HEX_LUT = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export class ArrayUtils {
  /**
   * 將 Uint8Array 轉換為 base64
   */
  static toBase64(bytes: Uint8Array): string {
    return encodeBase64(bytes);
  }

  /**
   * 從 base64 轉換為 Uint8Array
   */
  static fromBase64(base64String: string): Uint8Array {
    return decodeBase64(base64String);
  }

  /**
   * 將 Uint8Array 轉換為字串（UTF-8）
   */
  static toString(bytes: Uint8Array): string {
    try {
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return this.toBase64(bytes);
    }
  }

  /**
   * 將 Uint8Array 轉換為 JSON 字串（base64 表示）
   */
  static toJSON(bytes: Uint8Array): string {
    return this.toBase64(bytes);
  }

  /**
   * 將 Uint8Array 轉換為十六進位（使用 LUT，比逐位元 toString 快 5-10 倍）
   */
  static toHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += HEX_LUT[bytes[i]];
    }
    return hex;
  }

  /**
   * 從十六進位轉換為 Uint8Array（奇數長度自動補零）
   */
  static fromHex(hex: string): Uint8Array {
    const cleanHex = hex.length % 2 !== 0 ? `0${hex}` : hex;
    const len = cleanHex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
}