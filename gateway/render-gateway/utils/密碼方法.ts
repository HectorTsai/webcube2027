const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PREFIX = "enc:v1";
const IV_LENGTH = 12; // AES-GCM 標準 IV 長度
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;

// 從環境變數取得加密金鑰
function 取得加密金鑰(): string {
  const secretKey = Deno.env.get('SECRET_KEY');
  if (!secretKey) {
    throw new Error('SECRET_KEY 環境變數未設定，無法進行加密/解密操作');
  }
  return secretKey;
}

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
 * 自動從環境變數 SECRET_KEY 取得加密金鑰。
 */
export async function 加密(值: string): Promise<string> {
  try {
    const secretKey = 取得加密金鑰();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await 派生金鑰(secretKey, salt);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(值 ?? ""),
    );

    const cipher = new Uint8Array(cipherBuffer);
    return `${PREFIX}|${toBase64(iv)}|${toBase64(salt)}|${toBase64(cipher)}`;
  } catch (錯誤) {
    throw new Error(`加密失敗: ${錯誤}`);
  }
}

/**
 * 解密單一欄位：若非 enc:v1 前綴則視為明文；失敗時拋出錯誤。
 * 自動從環境變數 SECRET_KEY 取得加密金鑰。
 */
export async function 解密(值: string | undefined | null): Promise<string> {
  if (!值 || typeof 值 !== 'string') return "";
  if (!值.startsWith(`${PREFIX}|`)) return 值; // 視為明文

  const parts = 值.split("|");
  if (parts.length !== 4) {
    throw new Error('加密資料格式錯誤');
  }

  const [, ivB64, saltB64, cipherB64] = parts;

  try {
    const secretKey = 取得加密金鑰();
    const iv = fromBase64(ivB64);
    const salt = fromBase64(saltB64);
    const cipher = fromBase64(cipherB64);
    const key = await 派生金鑰(secretKey, salt);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      cipher.buffer as ArrayBuffer,
    );
    return decoder.decode(plainBuffer);
  } catch (錯誤) {
    throw new Error(`解密失敗: ${錯誤}`);
  }
}
