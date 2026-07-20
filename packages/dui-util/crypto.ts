const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PREFIX = "enc:v1";
const IV_LENGTH = 12; // AES-GCM standard IV length
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;

const DEFAULT_KEY_PATH = './data/.crypto.key';

// ── Key Resolution ──
//
// Priority:
//   1. SECRET_KEY environment variable (production deployments)
//   2. .crypto.key file (auto-generated on first run, survives restarts)
//   3. Auto-generate + write to .crypto.key (zero-setup first run)

/**
 * Resolve the encryption key.
 *
 * Checks (in order):
 * 1. `SECRET_KEY` env var
 * 2. `./data/.crypto.key` file (or `CRYPTO_KEY_PATH` env var)
 * 3. Auto-generates a new 256-bit key and writes it to the key file
 *
 * The resolved key is cached for subsequent calls.
 */
function getSecretKey(): string {
  const cached = _getCachedKey();
  if (cached) return cached;

  // 1. Env var
  const envKey = Deno.env.get('SECRET_KEY');
  if (envKey) {
    _setCachedKey(envKey);
    return envKey;
  }

  // 2. Key file
  const keyPath = Deno.env.get('CRYPTO_KEY_PATH') || DEFAULT_KEY_PATH;
  try {
    const fileKey = Deno.readTextFileSync(keyPath).trim();
    if (fileKey.length >= 16) {
      _setCachedKey(fileKey);
      return fileKey;
    }
  } catch {
    // file doesn't exist → will auto-generate
  }

  // 3. Auto-generate
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const newKey = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  try {
    const dir = keyPath.substring(0, keyPath.lastIndexOf('/'));
    if (dir) Deno.mkdirSync(dir, { recursive: true });
    Deno.writeTextFileSync(keyPath, newKey, { mode: 0o600 });
    _setCachedKey(newKey);
    return newKey;
  } catch {
    throw new Error(
      'No SECRET_KEY env var set and cannot write key file at ' + keyPath + '. ' +
      'Set SECRET_KEY environment variable or ensure write access to the directory.'
    );
  }
}

// Module-level key cache
let _key: string | null = null;
function _getCachedKey(): string | null { return _key; }
function _setCachedKey(k: string): void { _key = k; }

/**
 * Ensure the encryption key exists (idempotent).
 * Call this during startup to proactively generate the key file
 * without triggering an encrypt/decrypt.
 *
 * @param keyDir Optional directory path for the .crypto.key file.
 *
 * Returns the resolved key path.
 */
export function ensureKey(keyDir?: string): string {
  if (keyDir) {
    Deno.env.set('CRYPTO_KEY_PATH', `${keyDir}/.crypto.key`);
  }
  getSecretKey();
  return Deno.env.get('CRYPTO_KEY_PATH') || DEFAULT_KEY_PATH;
}

// ── Base64 ──

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Key Derivation ──

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

// ── Public API ──

/**
 * Encrypt a value. Returns a Base64 string with `enc:v1` prefix.
 *
 * The encryption key is resolved automatically via `getSecretKey()`.
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
 * Decrypt a value. If the value does not have the `enc:v1` prefix,
 * it is returned as-is (plaintext passthrough).
 */
export async function decrypt(value: string | undefined | null): Promise<string> {
  if (!value || typeof value !== 'string') return "";
  if (!value.startsWith(`${PREFIX}|`)) return value; // plaintext passthrough

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
