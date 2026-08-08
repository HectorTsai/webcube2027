/**
 * POST /api/anonymous-token — 簽發訪客 JWT
 *
 * 提供無 JWT 的服務（WebCube 或其他 Gateway）向 auth-gateway 取得訪客 JWT。
 * 訪客 JWT 包含 tenant 資訊、訪客使用者身份，以及從 data-gateway 取得的角色權限。
 *
 * 角色權限查詢透過 accountPool.request() 代理，不直接打 data-gateway。
 *
 * Request body:  { domain: "www.dui.com.tw" }
 * Response:      { success: true, data: { token: "eyJ..." } }
 */

import type { Context } from 'hono';
import { sign } from 'hono/jwt';
import { getKeys } from '../../../utils/keys.ts';
import { accountPool } from '../../../services/account-pool.ts';

/** 訪客 JWT 有效期（秒）— 1 小時 */
const VISITOR_TTL = 3600;

/** 從 data-gateway 取得訪客角色的權限設定（透過 pool 代理） */
async function getVisitorPermissions(): Promise<Record<string, unknown>> {
  try {
    const res = await accountPool.request('GET', '/api/l1/使用者:角色:訪客');
    if (!res.ok) return {};
    const body = await res.json() as { success?: boolean; data?: unknown };
    return (body?.success ? (body.data as Record<string, unknown>)?.權限 as Record<string, unknown> || {} : {});
  } catch {
    return {};
  }
}

export async function POST(c: Context) {
  try {
    const { domain } = await c.req.json();

    if (!domain || typeof domain !== 'string') {
      return c.json({ success: false, error: '請提供 domain' }, 400);
    }

    const { privateKey } = getKeys();
    const now = Math.floor(Date.now() / 1000);

    // 取得訪客角色權限（若 data-gateway 尚未就緒則給空權限）
    let 權限: Record<string, unknown> = {};
    try {
      權限 = await getVisitorPermissions();
    } catch {
      // data-gateway 尚未就緒，訪客預設無權限
    }

    const payload = {
      tenant: domain,
      sub: '使用者:使用者:訪客',
      帳號: '訪客',
      角色: ['使用者:角色:訪客'],
      type: 'visitor',
      權限,
      iat: now,
      exp: now + VISITOR_TTL,
    };

    const token = await sign(payload, privateKey, 'EdDSA');

    return c.json({ success: true, data: { token } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `簽發訪客 JWT 失敗：${msg}` }, 500);
  }
}