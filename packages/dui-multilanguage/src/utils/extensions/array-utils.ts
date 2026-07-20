/**
 * Uint8Array 工具函數 - 替代原型擴展
 */
export class ArrayUtils {
  /**
   * 將 Uint8Array 轉換為 base64
   */
  static toBase64(bytes: Uint8Array): string {
    // 使用更安全的方式轉換大型 Uint8Array 為 base64
    const chunkSize = 0x8000; // 32KB chunks
    const chunks: string[] = [];

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = Array.from(bytes.subarray(i, i + chunkSize));
      chunks.push(String.fromCharCode(...chunk));
    }
    return btoa(chunks.join(""));
  }

  /**
   * 從 base64 轉換為 Uint8Array
   */
  static fromBase64(base64String: string): Uint8Array {
    const binary = atob(base64String);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * 將 Uint8Array 轉換為字串
   */
  static toString(bytes: Uint8Array): string {
    try {
      // 嘗試 UTF-8 解碼
      return new TextDecoder("utf-8").decode(bytes);
    } catch (_e) {
      // 如果解碼失敗，返回 base64 表示
      return this.toBase64(bytes);
    }
  }

  /**
   * 將 Uint8Array 轉換為 JSON 字串
   */
  static toJSON(bytes: Uint8Array): string {
    return this.toBase64(bytes);
  }

  /**
   * 將 Uint8Array 轉換為十六進位
   */
  static toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * 從十六進位轉換為 Uint8Array
   */
  static fromHex(hex: string): Uint8Array {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return arr;
  }
}
