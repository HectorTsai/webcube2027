// Crypto — AES-256-GCM encryption/decryption with automatic key management
//
// Uses the system secret key (256-bit random hex key) directly for AES-GCM,
// avoiding costly PBKDF2 iterations for new encryptions (v2 format).
// Legacy v1 format (PBKDF2-derived) is still supported for backward compatibility.

import { dirname } from '@std/path';
import { encodeBase64, decodeBase64 } from '@std/encoding/base64';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;
const DEFAULT_KEY_PATH = './data/.crypto.key';

// ── Key Cache (module-level) ──

let _cachedKey: string | null = null;

// ── Key Resolution ──

function getSecretKey(): string {
  if (_cachedKey) return _cachedKey;

  // 0. CRYPTO_KEY env var — set by framework via registerKey()
  const runtimeKey = Deno.env.get('CRYPTO_KEY');
  if (runtimeKey) {
    _cachedKey = runtimeKey;
    return runtimeKey;
  }

  // 1. SECRET_KEY env var (production deployments)
  const envKey = Deno.env.get('SECRET_KEY');
  if (envKey) {
    _cachedKey = envKey;
    return envKey;
  }

  // 2. Key file
  const keyPath = Deno.env.get('CRYPTO_KEY_PATH') || DEFAULT_KEY_PATH;
  try {
    const fileKey = Deno.readTextFileSync(keyPath).trim();
    if (fileKey.length >= 16) {
      _cachedKey = fileKey;
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
    const dir = dirname(keyPath);
    if (dir && dir !== '.') Deno.mkdirSync(dir, { recursive: true });
    Deno.writeTextFileSync(keyPath, newKey, { mode: 0o600 });
    _cachedKey = newKey;
    return newKey;
  } catch {
    throw new Error(
      'No SECRET_KEY env var set and cannot write key file at ' + keyPath + '. ' +
      'Set SECRET_KEY environment variable or ensure write access to the directory.',
    );
  }
}

// ── Helper: hex → Uint8Array ──

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  // 奇數長度時補前導零，避免 ArrayBuffer 長度產生小數
  const cleanHex = hex.length % 2 !== 0 ? `0${hex}` : hex;
  const buffer = new ArrayBuffer(cleanHex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ── Direct AES-GCM Key (v2, no PBKDF2) ──

let _directKey: CryptoKey | null = null;

async function getDirectKey(): Promise<CryptoKey> {
  if (_directKey) return _directKey;
  const raw = hexToBytes(getSecretKey());
  _directKey = await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
  return _directKey;
}

// ── Legacy PBKDF2 Key Cache (v1 backward compat) ──

const _legacyKeyCache = new Map<string, CryptoKey>();

async function getLegacyKey(salt: Uint8Array): Promise<CryptoKey> {
  const hexKey = getSecretKey();
  const cacheKey = hexKey + '|' + encodeBase64(salt);
  const cached = _legacyKeyCache.get(cacheKey);
  if (cached) return cached;

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(hexKey),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as Uint8Array<ArrayBuffer>, // 直接傳入 Uint8Array，比 salt.buffer as ArrayBuffer 更簡潔
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
  _legacyKeyCache.set(cacheKey, key);
  return key;
}

// ── Public API ──

/**
 * Register the crypto key programmatically.
 *
 * Sets the CRYPTO_KEY env var and module cache so subsequent
 * encrypt() / decrypt() calls use this key.
 */
export function registerKey(hexKey: string): void {
  Deno.env.set('CRYPTO_KEY', hexKey);
  _cachedKey = hexKey;
}

/**
 * Ensure the encryption key exists (idempotent).
 * Call during startup to proactively generate the key file.
 */
export function ensureKey(keyDir?: string): string {
  if (keyDir) {
    Deno.env.set('CRYPTO_KEY_PATH', `${keyDir}/.crypto.key`);
  }
  getSecretKey();
  return Deno.env.get('CRYPTO_KEY_PATH') || DEFAULT_KEY_PATH;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * Uses v2 format (direct AES-GCM, no PBKDF2):
 *   enc:v2|{base64(iv)}|{base64(cipher)}
 *
 * The key is resolved automatically via the secret key chain.
 */
export async function encrypt(value: string): Promise<string> {
  try {
    const key = await getDirectKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(value ?? ''),
    );
    const cipher = new Uint8Array(cipherBuffer);
    return `enc:v2|${encodeBase64(iv)}|${encodeBase64(cipher)}`;
  } catch (err) {
    throw new Error(`Encryption failed: ${err}`);
  }
}

/**
 * Decrypt an encrypted string.
 *
 * Supports both:
 * - enc:v2 — direct AES-GCM (current, fast)
 * - enc:v1 — PBKDF2-derived (legacy, backward compatible)
 *
 * Non-encrypted values are returned as-is (plaintext passthrough).
 */
export async function decrypt(value: string | undefined | null): Promise<string> {
  if (!value) return '';
  if (!value.startsWith('enc:')) return value; // plaintext passthrough

  const parts = value.split('|');
  const version = parts[0];

  if (version === 'enc:v2') {
    if (parts.length !== 3) throw new Error('Invalid enc:v2 format');
    const [, ivB64, cipherB64] = parts;
    try {
      const key = await getDirectKey();
      const iv = decodeBase64(ivB64);
      const cipher = decodeBase64(cipherB64);
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipher,
      );
      return decoder.decode(plain);
    } catch (err) {
      throw new Error(`Decryption failed: ${err}`);
    }
  }

  if (version === 'enc:v1') {
    if (parts.length !== 4) throw new Error('Invalid enc:v1 format');
    const [, ivB64, saltB64, cipherB64] = parts;
    try {
      const salt = decodeBase64(saltB64);
      const key = await getLegacyKey(salt);
      const iv = decodeBase64(ivB64);
      const cipher = decodeBase64(cipherB64);
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipher,
      );
      return decoder.decode(plain);
    } catch (err) {
      throw new Error(`Decryption failed: ${err}`);
    }
  }

  throw new Error(`Unknown encryption version: ${version}`);
}