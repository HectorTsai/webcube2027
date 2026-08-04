/**
 * POST /api/register-gateway — 註冊 Gateway 並取得 API Key
 *
 * 其他 Gateway（auth、site 等）安裝時呼叫此端點註冊。
 * 需提供 Master Key（與 data-gateway 安裝時設定的相同）以證明授權。
 *
 * Request body:
 *   { name: "auth-gateway", master_key: "...", 權限: { "使用者": { 讀: true, 寫: true } } }
 *
 * Response:
 *   { success: true, data: { api_key: "sk-..." } }
 */

import type { Context } from 'hono';
import { getConfig } from '../../../services/config.ts';
import { info, error as logError, decrypt } from '@dui/util';

/** 產生隨機 API Key（32 bytes → hex） */
function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'sk-' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(c: Context) {
  try {
    const { name, master_key, 權限 } = await c.req.json();

    // ── 驗證輸入 ──
    if (!name || typeof name !== 'string') {
      return c.json({ success: false, error: '請提供 gateway 名稱（name）' }, 400);
    }
    if (!master_key || typeof master_key !== 'string') {
      return c.json({ success: false, error: '請提供 Master Key' }, 400);
    }
    if (!權限 || typeof 權限 !== 'object') {
      return c.json({ success: false, error: '請提供權限表（權限）' }, 400);
    }

    const config = getConfig();

    // ── 驗證 Master Key ──
    const storedEncrypted = await config.get('master_key');
    if (!storedEncrypted) {
      return c.json({ success: false, error: 'data-gateway 尚未設定 Master Key，請先完成安裝' }, 500);
    }

    let storedMasterKey: string;
    try {
      storedMasterKey = await decrypt(storedEncrypted as string);
    } catch {
      return c.json({ success: false, error: 'Master Key 解密失敗' }, 500);
    }

    if (master_key !== storedMasterKey) {
      return c.json({ success: false, error: 'Master Key 錯誤' }, 403);
    }

    // ── 產生 API Key 並儲存 ──
    const apiKey = generateApiKey();

    // ConfigStore 只存 string，須 JSON.stringify/parse
    const stored = await config.get('api_keys');
    const apiKeys: Record<string, { name: string; 權限: Record<string, { 讀: boolean; 寫: boolean }> }> =
      stored ? JSON.parse(stored) : {};

    if (apiKeys[apiKey]) {
      // 碰撞（極不可能發生）重試一次
      return c.json({ success: false, error: 'API Key 產生衝突，請重試' }, 500);
    }

    apiKeys[apiKey] = { name, 權限 };
    await config.set('api_keys', JSON.stringify(apiKeys));

    // ── 記錄 Gateway 位址（供 health 等查詢各 gateway 位置） ──
    try {
      const origin = new URL(c.req.url).origin;
      const storedGw = await config.get('gateways');
      const gateways: Record<string, string> = storedGw ? JSON.parse(storedGw) : {};
      gateways[name] = origin;
      await config.set('gateways', JSON.stringify(gateways));
      await info('DataGateway', `已記錄 ${name} 位址：${origin}`);
    } catch {
      await info('DataGateway', `無法取得 ${name} 的請求來源位址`);
    }

    await info('DataGateway', `Gateway 已註冊：${name}（${Object.keys(權限).length} 個 collection 權限）`);

    return c.json({ success: true, data: { api_key: apiKey } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('DataGateway', `Gateway 註冊失敗：${msg}`);
    return c.json({ success: false, error: `註冊失敗：${msg}` }, 500);
  }
}