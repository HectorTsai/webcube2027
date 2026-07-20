/**
 * 字串工具函數 - 替代原型擴展
 */
export class StringUtils {
  /**
   * 將字串首字母大寫
   */
  static capitalize(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * 將字串中每個單詞首字母大寫
   */
  static capitalizeAll(str: string): string {
    if (!str) return "";
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * 將字串轉換為 Uint8Array
   */
  static toUint8Array(str: string): Uint8Array {
    try {
      // 嘗試 base64 解碼
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (_e) {
      // 如果不是 base64，使用 UTF-8 編碼
      return new TextEncoder().encode(str);
    }
  }

  /**
   * 從 Uint8Array 轉換為字串
   */
  static fromUint8Array(bytes: Uint8Array): string {
    try {
      // 嘗試 UTF-8 解碼
      return new TextDecoder("utf-8").decode(bytes);
    } catch (_e) {
      // 如果 UTF-8 解碼失敗，嘗試 base64 編碼
      const binary = Array.from(bytes).map((byte) => String.fromCharCode(byte))
        .join("");
      return btoa(binary);
    }
  }

  /**
   * 將字串轉換為十六進位
   */
  static toHex(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * 從十六進位轉換為字串
   */
  static fromHex(hex: string): string {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    const decoder = new TextDecoder();
    return decoder.decode(arr);
  }

  /**
   * 將字串轉換為 ArrayBuffer
   */
  static toArrayBuffer(str: string): ArrayBuffer {
    try {
      const uint8Array = this.toUint8Array(str);
      // 創建一個新的 ArrayBuffer 來確保類型安全
      const arrayBuffer = new ArrayBuffer(uint8Array.length);
      new Uint8Array(arrayBuffer).set(uint8Array);
      return arrayBuffer;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "未知錯誤";
      throw new Error(`無法將字串轉換為 ArrayBuffer: ${errorMessage}`);
    }
  }

  /**
   * 從 ArrayBuffer 轉換為字串
   */
  static fromArrayBuffer(buffer: ArrayBuffer): string {
    return this.fromUint8Array(new Uint8Array(buffer));
  }
}
