/**
 * 共用金鑰 — Ed25519 金鑰對管理
 *
 * main.ts 初始化金鑰後存入此模組，檔案路由透過此模組取得金鑰。
 */

// ── Hex helpers ──

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ── Key state ──

let _privateKey: CryptoKey | null = null;
let _publicKey: CryptoKey | null = null;
let _publicKeyHex = '';

export function getKeys(): { privateKey: CryptoKey; publicKey: CryptoKey; publicKeyHex: string } {
  if (!_privateKey || !_publicKey) {
    throw new Error('JWT 金鑰尚未初始化，請先呼叫 initKeys()');
  }
  return { privateKey: _privateKey, publicKey: _publicKey, publicKeyHex: _publicKeyHex };
}

export async function initKeys(l1: { get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<void> }) {
  const storedPrivateHex = await l1.get('_jwt_private_key');

  if (storedPrivateHex) {
    _privateKey = await crypto.subtle.importKey(
      'pkcs8', hexToBytes(storedPrivateHex), { name: 'Ed25519' }, false, ['sign'],
    );

    const storedPublicHex = await l1.get('_jwt_public_key');
    _publicKey = await crypto.subtle.importKey(
      'spki', hexToBytes(storedPublicHex!), { name: 'Ed25519' }, false, ['verify'],
    );
    _publicKeyHex = storedPublicHex!;
    return { privateKey: _privateKey, publicKey: _publicKey, publicKeyHex: _publicKeyHex };
  }

  // 產生新金鑰對
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' }, true, ['sign', 'verify'],
  ) as CryptoKeyPair;

  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey));

  _privateKey = keyPair.privateKey;
  _publicKey = keyPair.publicKey;
  _publicKeyHex = bytesToHex(spki);

  await l1.set('_jwt_private_key', bytesToHex(pkcs8));
  await l1.set('_jwt_public_key', _publicKeyHex);

  return { privateKey: _privateKey, publicKey: _publicKey, publicKeyHex: _publicKeyHex };
}
