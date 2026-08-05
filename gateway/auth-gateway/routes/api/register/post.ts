/**
 * POST /api/register — 租戶公開註冊
 *
 * 規則：
 *   - 一律寫入 L3（租戶資料庫）；L3 不存在（網站未啟用租戶資料庫）→ 直接回傳錯誤
 *   - L3 第一位註冊 → 角色「使用者:角色:管理員」（該租戶站台管理者）
 *   - 其後註冊 → 角色「使用者:角色:會員」
 *   - 不接受呼叫端指定角色（body.角色 一律忽略）
 *
 * tenant 取得順序：body.tenant → cookie 訪客 JWT → Host header。
 * 系統安裝（setup）不經由此端點，直接操作 L2 資料庫。
 *
 * Request:  { 帳號, 密碼, tenant?, 名稱? }
 * Response: { success: true, data: { id, 帳號, 角色, tenant } }
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../utils/config.ts';
import { getKeys } from '../../../utils/keys.ts';
import { 使用者 } from '../../../database/models/使用者.ts';
import { info, error as logError } from '@dui/util';

/** 正規化 tenant：去協定、路徑與埠號，轉小寫 hostname */
function normalizeTenant(tenant: string): string {
  return tenant.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '').toLowerCase();
}

/** 依序從 body.tenant → cookie 訪客 JWT → Host header 取得租戶 */
async function resolveTenant(c: Context, bodyTenant: unknown): Promise<string | null> {
  if (typeof bodyTenant === 'string' && bodyTenant.trim()) {
    return normalizeTenant(bodyTenant.trim());
  }

  const token = getCookie(c, 'jwt');
  if (token) {
    try {
      const { publicKey } = getKeys();
      const payload = await verify(token, publicKey, 'EdDSA') as Record<string, unknown>;
      if (typeof payload.tenant === 'string' && payload.tenant) {
        return normalizeTenant(payload.tenant);
      }
    } catch {
      // 忽略無效的 cookie token，繼續往下找
    }
  }

  const host = c.req.header('host');
  if (host) return normalizeTenant(host);
  return null;
}

export async function POST(c: Context) {
  try {
    const body = await c.req.json() as Record<string, unknown>;
    const 帳號 = typeof body.帳號 === 'string' ? body.帳號.trim() : '';
    const 密碼 = typeof body.密碼 === 'string' ? body.密碼 : '';
    // 注意：不接受呼叫端指定角色（body.角色 在此刻意忽略）

    if (!帳號 || !密碼) {
      return c.json({ success: false, error: '請提供帳號與密碼' }, 400);
    }

    const tenant = await resolveTenant(c, body.tenant);
    if (!tenant) {
      return c.json({ success: false, error: '無法判定租戶（tenant）' }, 400);
    }

    const dataGatewayUrl = await getDataGatewayUrl();
    const apiKey = await getDataGatewayApiKey();
    if (!dataGatewayUrl || !apiKey) {
      return c.json({ success: false, error: 'auth-gateway 尚未安裝，data-gateway 未就緒' }, 500);
    }

    const l3Headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant': tenant,
    };
    if (apiKey) l3Headers['X-API-Key'] = apiKey;

    // ── 1. 確認 L3 存在，並判斷是否為第一位註冊 ──
    // L3 不存在時，data-gateway 會回傳錯誤（不再降級 L2）
    const checkRes = await fetch(`${dataGatewayUrl}/api/l3/使用者/使用者?limit=1`, {
      headers: l3Headers,
    });
    const checkJson = await checkRes.json();
    if (!checkJson.success) {
      return c.json(
        { success: false, error: `租戶 ${tenant} 的 L3 資料庫不存在或未啟用` },
        400,
      );
    }
    const isFirstUser = !checkJson.pagination?.totalCount;

    // ── 2. 建立使用者實體（第一位註冊為管理員，其餘為會員）──
    const roleId = isFirstUser ? '使用者:角色:管理員' : '使用者:角色:會員';
    const bcrypt = (await import('bcryptjs')) as any;
    const salt = bcrypt.default.genSaltSync(10);
    const 密碼雜湊 = bcrypt.default.hashSync(密碼, salt);

    const userId = `使用者:使用者:${帳號}`;
    const user = new 使用者({
      id: userId,
      帳號,
      密碼雜湊,
      角色: [roleId],
    });

    // ── 3. 寫入 L3 ──
    const createRes = await fetch(`${dataGatewayUrl}/api/l3/使用者/使用者`, {
      method: 'POST',
      headers: l3Headers,
      body: JSON.stringify(user),
    });
    const createJson = await createRes.json();

    if (!createJson.success) {
      return c.json({ success: false, error: createJson.error || '建立使用者失敗' }, 500);
    }

    await info('Register', `${帳號} 註冊成功（${tenant}，${isFirstUser ? '管理員' : '會員'}）`);
    return c.json({
      success: true,
      data: { id: userId, 帳號, 角色: [roleId], tenant },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('Register', `註冊失敗：${msg}`);
    return c.json({ success: false, error: `註冊失敗：${msg}` }, 500);
  }
}
