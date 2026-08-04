/**
 * POST /api/setup — 首次安裝
 *
 * 接收 auth-gateway URL、data-gateway URL 與 Master Key，
 * 向 data-gateway 註冊取得專屬 API Key，
 * 後續所有 data-gateway 呼叫皆帶 X-API-Key header。
 */

import type { Context } from 'hono';
import { getConfig } from '../../../utils/config.ts';
import { info, error as logError } from '@dui/util';

export async function POST(c: Context) {
  try {
    const { auth_gateway_url, data_gateway_url, master_key } = await c.req.json();

    if (!auth_gateway_url || typeof auth_gateway_url !== 'string') {
      return c.json({ success: false, error: '請填寫 auth-gateway URL' }, 400);
    }
    if (!data_gateway_url || typeof data_gateway_url !== 'string') {
      return c.json({ success: false, error: '請填寫 data-gateway URL' }, 400);
    }
    if (!master_key || typeof master_key !== 'string') {
      return c.json({ success: false, error: '請填寫 Master Key（由 data-gateway 管理員提供）' }, 400);
    }

    // URL 格式驗證
    try { new URL(auth_gateway_url); } catch {
      return c.json({ success: false, error: 'auth-gateway URL 格式不正確' }, 400);
    }
    try { new URL(data_gateway_url); } catch {
      return c.json({ success: false, error: 'data-gateway URL 格式不正確' }, 400);
    }

    const config = getConfig();

    // 檢查是否已安裝
    const existing = await config.get('auth_gateway_url');
    if (existing) {
      return c.json({
        success: false, error: 'site-gateway 已完成安裝。若需重新安裝，請清除 config 檔案。'
      }, 400);
    }

    // ── 1. 向 data-gateway 註冊取得 API Key ──
    const baseUrl = data_gateway_url.replace(/\/+$/, '');
    const registerRes = await fetch(`${baseUrl}/api/register-gateway`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'site-gateway',
        master_key,
        權限: {
          '網站資訊': { 讀: true, 寫: true },
          '使用者': { 讀: true, 寫: false },
          '角色': { 讀: true, 寫: false },
        },
      }),
    });

    const registerData = await registerRes.json();
    if (!registerData.success) {
      return c.json({
        success: false,
        error: `向 data-gateway 註冊失敗：${registerData.error || '未知錯誤'}`,
      }, 500);
    }

    const apiKey: string = registerData.data.api_key;

    // ── 2. 寫入 ConfigStore ──
    await config.set('auth_gateway_url', auth_gateway_url);
    await config.set('data_gateway_url', data_gateway_url);
    await config.set('data_gateway_api_key', apiKey);
    await info('SiteGateway', `auth-gateway: ${auth_gateway_url}`);
    await info('SiteGateway', `data-gateway: ${data_gateway_url}`);
    await info('SiteGateway', '已向 data-gateway 註冊並取得 API Key');

    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('SiteGateway', `安裝失敗：${msg}`);
    return c.json({ success: false, error: `安裝失敗：${msg}` }, 500);
  }
}