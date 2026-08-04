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

export async function initKeys(config: { get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<void> }) {
  const storedPrivateHex = await config.get('_jwt_private_key');
  const storedPublicHex = await config.get('_jwt_public_key');

  // 金鑰對不完整 → 明確報錯，避免默默重生導致所有已簽發 token 失效
  if ((storedPrivateHex && !storedPublicHex) || (!storedPrivateHex && storedPublicHex)) {
    throw new Error(
      'JWT 金鑰對不完整（_jwt_private_key 與 _jwt_public_key 缺少其一）。' +
      '請修復 config.json，或刪除這兩個欄位以重新產生金鑰對。',
    );
  }

  if (storedPrivateHex && storedPublicHex) {
    _privateKey = await crypto.subtle.importKey(
      'pkcs8', hexToBytes(storedPrivateHex), { name: 'Ed25519' }, false, ['sign'],
    );
    _publicKey = await crypto.subtle.importKey(
      'spki', hexToBytes(storedPublicHex), { name: 'Ed25519' }, false, ['verify'],
    );
    _publicKeyHex = storedPublicHex;

    // 驗證金鑰對確實匹配（private 簽章能被 public 驗證）
    const test = new TextEncoder().encode('key-pair-check');
    const sig = await crypto.subtle.sign('Ed25519', _privateKey, test);
    const ok = await crypto.subtle.verify('Ed25519', _publicKey, sig, test);
    if (!ok) {
      throw new Error(
        'JWT 金鑰對不匹配（private 與 public 不是同一對）。' +
        '請修正 config.json 的 _jwt_private_key / _jwt_public_key。',
      );
    }

    return { privateKey: _privateKey, publicKey: _publicKey, publicKeyHex: _publicKeyHex };
  }

  // 兩者皆無 → 首次安裝，產生新金鑰對
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' }, true, ['sign', 'verify'],
  ) as CryptoKeyPair;

  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey));

  _privateKey = keyPair.privateKey;
  _publicKey = keyPair.publicKey;
  _publicKeyHex = bytesToHex(spki);

  await config.set('_jwt_private_key', bytesToHex(pkcs8));
  await config.set('_jwt_public_key', _publicKeyHex);

  return { privateKey: _privateKey, publicKey: _publicKey, publicKeyHex: _publicKeyHex };
}
