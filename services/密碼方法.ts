const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PREFIX = "enc:v1";
const IV_LENGTH = 12; // AES-GCM 標準 IV 長度
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;

// 將位元組轉成 Base64
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}

// 將 Base64 還原成位元組
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// 透過密碼與 salt 派生 AES-GCM 金鑰
async function 派生金鑰(密碼: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(密碼),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * 加密單一欄位：回傳 enc:v1 開頭的 Base64 字串。
 * 密碼不存在時回傳空字串。
 */
export async function 加密(值: string, 密碼?: string): Promise<string> {
  if (!密碼) return "";
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await 派生金鑰(密碼, salt);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(值 ?? ""),
  );

  const cipher = new Uint8Array(cipherBuffer);
  return `${PREFIX}:${toBase64(iv)}:${toBase64(salt)}:${toBase64(cipher)}`;
}

/**
 * 解密單一欄位：若非 enc:v1 前綴則視為明文；失敗或無密碼回傳空字串。
 */
export async function 解密(值: string | undefined | null, 密碼?: string): Promise<string> {
  if (!值) return "";
  if (!密碼) return "";
  if (!值.startsWith(`${PREFIX}:`)) return 值; // 視為明文

  const parts = 值.split(":");
  if (parts.length !== 4) return "";

  const [, ivB64, saltB64, cipherB64] = parts;

  try {
    const iv = fromBase64(ivB64);
    const salt = fromBase64(saltB64);
    const cipher = fromBase64(cipherB64);
    const key = await 派生金鑰(密碼, salt);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      cipher.buffer as ArrayBuffer,
    );
    return decoder.decode(plainBuffer);
  } catch (_err) {
    return "";
  }
}
