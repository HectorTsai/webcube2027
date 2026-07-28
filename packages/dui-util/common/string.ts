/**
 * 字串工具函數
 *
 * 從 dui-multilanguage 移入 @dui/util/common，使用 @std/encoding/base64 標準編解碼。
 */

import { encodeBase64, decodeBase64 } from '@std/encoding/base64';

export class StringUtils {
  /**
   * 將字串首字母大寫
   */
  static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * 將字串中每個單詞首字母大寫
   */
  static capitalizeAll(str: string): string {
    if (!str) return '';
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * 將字串轉換為 Uint8Array
   * 先嘗試 base64 解碼，失敗則使用 UTF-8 編碼
   */
  static toUint8Array(str: string): Uint8Array {
    try {
      return decodeBase64(str);
    } catch {
      return new TextEncoder().encode(str);
    }
  }

  /**
   * 從 Uint8Array 轉換為字串
   * 先嘗試 UTF-8 解碼，失敗則使用 base64 編碼
   */
  static fromUint8Array(bytes: Uint8Array): string {
    try {
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return encodeBase64(bytes);
    }
  }

  /**
   * 將字串轉換為十六進位
   */
  static toHex(str: string): string {
    const bytes = new TextEncoder().encode(str);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * 從十六進位轉換為字串
   */
  static fromHex(hex: string): string {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return new TextDecoder().decode(arr);
  }

  /**
   * 將字串轉換為 ArrayBuffer
   * 使用 buffer.slice() 避免不必要的記憶體拷貝。
   */
  static toArrayBuffer(str: string): ArrayBuffer {
    const uint8Array = this.toUint8Array(str);
    return uint8Array.buffer.slice(
      uint8Array.byteOffset,
      uint8Array.byteOffset + uint8Array.byteLength,
    ) as ArrayBuffer;
  }

  /**
   * 從 ArrayBuffer 轉換為字串
   */
  static fromArrayBuffer(buffer: ArrayBuffer): string {
    return this.fromUint8Array(new Uint8Array(buffer));
  }
}