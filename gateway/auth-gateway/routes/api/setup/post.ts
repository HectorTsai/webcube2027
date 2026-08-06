/**
 * POST /api/setup — 首次安裝
 *
 * 1. 接收 data-gateway URL 與 Master Key，向 data-gateway 註冊取得專屬 API Key
 * 2. 寫入 L1 config（data_gateway_url / data_gateway_api_key）
 * 3. 寫入 L1 seed（訪客角色、訪客使用者）— 透過 L1 CRUD
 * 4. 寫入 L2 seed（訪客/超級管理員/管理員/會員/貴賓/黑名單 角色 + 訪客使用者）— 透過 L2 CRUD
 * 5. 建立超管理者帳號（角色：超級管理員）— 透過 L2 CRUD
 *
 * 後續所有 data-gateway 呼叫皆帶 X-API-Key header。
 */

import type { Context } from 'hono';
import { syncAllSeeds } from '@dui/framework';
import { getConfig } from '../../../utils/config.ts';
import { 使用者, type 使用者介面 } from '../../../database/models/使用者.ts';
import { 角色, type 角色介面 } from '../../../database/models/角色.ts';
import { MultilingualString } from '@dui/smartmultilingual';
import { info, error as logError } from '@dui/util';

/** 從 composite ID 拆出 collection 與 model 段 */
function splitId(id: string): { collection: string; model: string } | null {
  const parts = id.split(':');
  if (parts.length !== 3) return null;
  return { collection: parts[0], model: parts[1] };
}

/**
 * 依 composite ID 建立對應 Model 實體（補齊預設值），
 * 非 使用者 collection 的記錄直接回傳原始資料。
 * 作為 seed 同步的 prepare 鉤子。
 */
function instantiateRecord(record: Record<string, unknown>): Record<string, unknown> {
  const seg = splitId(record.id as string);
  if (!seg || seg.collection !== '使用者') return record;

  if (seg.model === '角色') {
    return new 角色(record as unknown as Partial<角色介面>).toJSON() as unknown as Record<string, unknown>;
  }
  if (seg.model === '使用者') {
    return new 使用者(record as unknown as Partial<使用者介面>).toJSON() as unknown as Record<string, unknown>;
  }
  return record;
}

export async function POST(c: Context) {
  try {
    const { data_gateway_url, master_key, 名稱, 帳號, 密碼 } = await c.req.json();

    if (!data_gateway_url || typeof data_gateway_url !== 'string') {
      return c.json({ success: false, error: '請填寫 data-gateway URL' }, 400);
    }
    if (!master_key || typeof master_key !== 'string') {
      return c.json({ success: false, error: '請填寫 Master Key（由 data-gateway 管理員提供）' }, 400);
    }
    if (!帳號 || typeof 帳號 !== 'string') {
      return c.json({ success: false, error: '請填寫超管理者帳號' }, 400);
    }
    if (!名稱 || typeof 名稱 !== 'string') {
      return c.json({ success: false, error: '請填寫超管理者顯示名稱' }, 400);
    }
    if (!密碼 || typeof 密碼 !== 'string' || 密碼.length < 6) {
      return c.json({ success: false, error: '請填寫超管理者密碼（至少 6 字元）' }, 400);
    }

    // URL 格式驗證
    try {
      new URL(data_gateway_url);
    } catch {
      return c.json({ success: false, error: 'URL 格式不正確' }, 400);
    }

    const config = getConfig();

    // 檢查是否已安裝
    const existing = await config.get('data_gateway_url');
    if (existing) {
      return c.json({ success: false, error: 'auth-gateway 已完成安裝。若需重新安裝，請清除 L1 資料。' }, 400);
    }

    // ── 1. 向 data-gateway 註冊取得 API Key ──
    const baseUrl = data_gateway_url.replace(/\/+$/, '');
    // 以自身請求 URL 計算本服務位址，讓 data-gateway 記錄正確的 gateway URL
    const selfUrl = new URL(c.req.url).origin;
    const registerRes = await fetch(`${baseUrl}/api/register-gateway`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'auth-gateway',
        url: selfUrl,
        master_key,
        權限: {
          '使用者': { 讀: true, 寫: true },
          '角色': { 讀: true, 寫: true },
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

    // ── 2. 寫入 L1 ──
    await config.set('data_gateway_url', data_gateway_url);
    await config.set('data_gateway_api_key', apiKey);
    await info('AuthGateway', `data-gateway URL 已設定：${data_gateway_url}`);
    await info('AuthGateway', '已向 data-gateway 註冊並取得 API Key');

    // ── 3. 寫入 L1/L2 seed（內容 hash 比對版本，版本不同時 PUT 覆寫） ──
    await syncAllSeeds({
      seedsRoot: new URL('../../../database/seeds/', import.meta.url),
      store: config,
      baseUrl,
      apiKey,
      prepare: instantiateRecord,
    });

    // ── 4. 建立超管理者帳號（角色：超級管理員）──
    const bcrypt = (await import('bcryptjs')) as any;
    const salt = bcrypt.default.genSaltSync(10);
    const 密碼雜湊 = bcrypt.default.hashSync(密碼, salt);
    const userId = `使用者:使用者:${帳號}`;
    // 先建立 使用者 實體（自動補齊 圖示/最後登入/created_at 等預設值），再序列化送出
    // 名稱來自安裝表單（以安裝者當下語言為 key，預設 zh-tw）
    const lang = (c.get('lang') || 'zh-tw') as string;
    const adminUser = new 使用者({
      id: userId,
      帳號,
      名稱: { [lang]: 名稱 } as unknown as MultilingualString,
      密碼雜湊,
      角色: ['使用者:角色:超級管理員'],
    });
    const createRes = await fetch(`${baseUrl}/api/l2/使用者/使用者`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(adminUser),
    });
    const createData = await createRes.json();
    if (!createData.success && !(createRes.status === 409 || /已存在/.test(createData.error || ''))) {
      return c.json({ success: false, error: `建立超管理者帳號失敗：${createData.error || '未知錯誤'}` }, 500);
    }
    await info('AuthGateway', `超管理者帳號已建立：${帳號}`);

    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('AuthGateway', `安裝失敗：${msg}`);
    return c.json({ success: false, error: `安裝失敗：${msg}` }, 500);
  }
}
