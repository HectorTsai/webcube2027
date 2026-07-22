/**
 * GET /api/jwt-public-key
 * 取得 Ed25519 公鑰（hex 編碼 SPKI 格式），供其他 gateway 本地驗證
 */

import type { Context } from 'hono';
import { getKeys } from '../../../utils/keys.ts';

export function GET(c: Context) {
  const { publicKeyHex } = getKeys();
  return c.json({ publicKey: publicKeyHex, algorithm: 'EdDSA' });
}
