const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PREFIX = "enc:v1";
const IV_LENGTH = 12; // AES-GCM standard IV length
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;

// Get encryption key from environment variable
function getSecretKey(): string {
  const secretKey = Deno.env.get('SECRET_KEY');
  if (!secretKey) {
    throw new Error('SECRET_KEY environment variable is not set, cannot perform encryption/decryption');
  }
  return secretKey;
}

// Convert bytes to Base64
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}

// Convert Base64 back to bytes
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Derive AES-GCM key from password and salt
async function deriveKey(password: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
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
 * Encrypt a single field: returns Base64 string prefixed with enc:v1.
 * Automatically gets the encryption key from SECRET_KEY env var.
 */
export async function encrypt(value: string): Promise<string> {
  try {
    const secretKey = getSecretKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await deriveKey(secretKey, salt);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(value ?? ""),
    );

    const cipher = new Uint8Array(cipherBuffer);
    return `${PREFIX}|${toBase64(iv)}|${toBase64(salt)}|${toBase64(cipher)}`;
  } catch (err) {
    throw new Error(`Encryption failed: ${err}`);
  }
}

/**
 * Decrypt a single field: if not enc:v1 prefixed, treated as plaintext.
 * Automatically gets the encryption key from SECRET_KEY env var.
 */
export async function decrypt(value: string | undefined | null): Promise<string> {
  if (!value || typeof value !== 'string') return "";
  if (!value.startsWith(`${PREFIX}|`)) return value; // treated as plaintext

  const parts = value.split("|");
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [, ivB64, saltB64, cipherB64] = parts;

  try {
    const secretKey = getSecretKey();
    const iv = fromBase64(ivB64);
    const salt = fromBase64(saltB64);
    const cipher = fromBase64(cipherB64);
    const key = await deriveKey(secretKey, salt);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      cipher.buffer as ArrayBuffer,
    );
    return decoder.decode(plainBuffer);
  } catch (err) {
    throw new Error(`Decryption failed: ${err}`);
  }
}
