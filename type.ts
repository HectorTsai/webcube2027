// String 原型擴展
String.prototype.capitalize = function (): string {
  const str = this.toString();
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

String.prototype.capitalizeAll = function (): string {
  const str = this.toString();
  if (!str) return "";
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// String 原型擴展 - 二進位轉換
String.prototype.toUint8Array = function (): Uint8Array {
  const str = this.toString();
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
};

String.prototype.fromUint8Array = function (bytes: Uint8Array): string {
  try {
    // 嘗試 UTF-8 解碼
    return new TextDecoder("utf-8").decode(bytes);
  } catch (_e) {
    // 如果 UTF-8 解碼失敗，嘗試 base64 編碼
    const binary = Array.from(bytes).map((byte) => String.fromCharCode(byte))
      .join("");
    return btoa(binary);
  }
};

String.prototype.toHex = function (): string {
  const str = this.toString();
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

String.prototype.fromHex = function (hex: string): string {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  const decoder = new TextDecoder();
  return decoder.decode(arr);
};

String.prototype.toArrayBuffer = function (): ArrayBuffer {
  try {
    const uint8Array = this.toUint8Array();
    // 創建一個新的 ArrayBuffer 來確保類型安全
    const arrayBuffer = new ArrayBuffer(uint8Array.length);
    new Uint8Array(arrayBuffer).set(uint8Array);
    return arrayBuffer;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知錯誤";
    throw new Error(`無法將字串轉換為 ArrayBuffer: ${errorMessage}`);
  }
};

String.prototype.fromArrayBuffer = function (buffer: ArrayBuffer): string {
  return this.fromUint8Array(new Uint8Array(buffer));
};

// Uint8Array 原型擴展 - 二進位轉換
Uint8Array.prototype.toBase64 = function (): string {
  // 使用更安全的方式轉換大型 Uint8Array 為 base64
  const chunkSize = 0x8000; // 32KB chunks
  const chunks: string[] = [];

  for (let i = 0; i < this.length; i += chunkSize) {
    const chunk = Array.from(this.subarray(i, i + chunkSize));
    chunks.push(String.fromCharCode(...chunk));
  }
  return btoa(chunks.join(""));
};
Uint8Array.prototype.toJSON = function (): string {
  return this.toBase64();
};
Uint8Array.prototype.fromBase64 = function (base64String: string): Uint8Array {
  const binary = atob(base64String);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

Uint8Array.prototype.toString = function (): string {
  try {
    // 嘗試 UTF-8 解碼
    return new TextDecoder("utf-8").decode(this);
  } catch (_e) {
    // 如果解碼失敗，返回 base64 表示
    return this.toBase64();
  }
};

Uint8Array.prototype.toHex = function (): string {
  return Array.from(this)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

Uint8Array.prototype.fromHex = function (hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
};
