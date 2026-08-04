/**
 * POST /api/site/apply — 申請新網站
 *
 * 職責：
 * 1. 透過 data-gateway L3 API 建立 L3 資料庫連線並初始化
 * 2. 透過 auth-gateway /api/register 建立網站管理員帳號
 * 3. 透過 data-gateway L2 API 寫入網站資訊
 *
 * 預設角色（會員/貴賓/黑名單）與管理員角色由 auth-gateway 安裝時
 * 寫入的 L2 seed 提供，此處不需重複建立。
 *
 * 所有對 data-gateway 的呼叫皆帶 X-API-Key header（安裝時註冊取得）。
 * 對 auth-gateway 的呼叫不需 API Key（/api/register 為公開端點）。
 */

import type { Context } from 'hono';
import { getDataGatewayUrl, getDataGatewayApiKey, getAuthGatewayUrl } from '../../../../utils/config.ts';
import { info, error as logError } from '@dui/util';

interface SiteApplyBody {
  mode: 'PUBLIC' | 'PRIVATE' | 'REDIRECT' | 'MIRROR';
  domain: string;
  title?: string;
  admin: { 帳號: string; 密碼: string };
  l3?: Record<string, unknown>;
}

/** 建立共用 headers（含 API Key） */
async function gwHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = await getDataGatewayApiKey();
  if (apiKey) headers['X-API-Key'] = apiKey;
  return headers;
}

export async function POST(c: Context) {
  try {
    const body: SiteApplyBody = await c.req.json();
    const { mode, domain, title, admin, l3 } = body;

    if (!mode || !domain || !admin?.帳號 || !admin?.密碼) {
      return c.json({ success: false, error: '缺少必要欄位：mode、domain、admin（帳號 + 密碼）' }, 400);
    }

    const validModes = ['PUBLIC', 'PRIVATE', 'REDIRECT', 'MIRROR'];
    if (!validModes.includes(mode)) {
      return c.json({ success: false, error: `無效的網站模式：${mode}，須為 ${validModes.join('、')}` }, 400);
    }

    const dataGwUrl = await getDataGatewayUrl();
    const headers = await gwHeaders();

    // ── 1. 建立 L3 資料庫 ──
    let l3Config: Record<string, unknown> = {};
    if (l3 && Object.keys(l3).length > 0) {
      l3Config = l3;
    } else {
      // 預設使用 L2 同類型資料庫
      const l2Info = await fetch(`${dataGwUrl}/api/l2/info`, { headers }).then(r => r.json());
      if (l2Info?.type) {
        l3Config = { type: l2Info.type };
        if (l2Info.host) l3Config.host = l2Info.host;
        if (l2Info.port) l3Config.port = l2Info.port;
        if (l2Info.username) l3Config.username = l2Info.username;
        if (l2Info.database) l3Config.database = l2Info.database;
      }
    }

    // 透過 data-gateway L3 API 初始化 L3 資料庫
    const l3InitRes = await fetch(`${dataGwUrl}/api/l3/init`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenant: domain, config: l3Config }),
    });
    const l3InitData = await l3InitRes.json();
    if (!l3InitData.success) {
      return c.json({ success: false, error: `L3 資料庫初始化失敗：${l3InitData.error}` }, 500);
    }

    // ── 2. 建立網站管理員帳號（透過 auth-gateway /api/register）──
    // register 不接受指定角色：L3 第一位註冊自動成為「管理員」。
    // 需傳 tenant 讓 register 寫入正確的 L3 資料庫。
    const authGwUrl = await getAuthGatewayUrl();
    const registerRes = await fetch(`${authGwUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        帳號: admin.帳號,
        密碼: admin.密碼,
        tenant: domain,
      }),
    });
    const adminData = await registerRes.json();
    if (!adminData.success) {
      return c.json({ success: false, error: `管理員帳號建立失敗：${adminData.error}` }, 500);
    }

    // ── 3. 寫入網站資訊至 L2 ──
    const siteInfoId = `網站資訊:網站資訊:${domain}`;
    const siteData: Record<string, unknown> = {
      id: siteInfoId,
      domain,
      mode,
      title: title || domain,
      plan: 'FREE',
      admin: admin.帳號,
      l3_config: l3Config,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    // L2 CRUD：POST /api/l2/{collection}/{model}
    const siteRes = await fetch(`${dataGwUrl}/api/l2/網站資訊/網站資訊`, {
      method: 'POST',
      headers,
      body: JSON.stringify(siteData),
    });
    const siteResult = await siteRes.json();

    if (!siteResult.success) {
      return c.json({ success: false, error: `網站資訊寫入失敗：${siteResult.error}` }, 500);
    }

    await info('SiteGateway', `網站已建立：${domain}（${mode}）`);
    return c.json({ success: true, data: { domain, mode, title: title || domain } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('SiteGateway', `網站申請失敗：${msg}`);
    return c.json({ success: false, error: `網站申請失敗：${msg}` }, 500);
  }
}