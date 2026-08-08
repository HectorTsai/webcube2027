/**
 * POST /api/register — 建立使用者帳號
 *
 * layer 參數決定寫入層級（預設 'l3'）：
 *   - l3（預設）：公開註冊，寫入租戶 L3（如 Firestore）。
 *        L3 第一位註冊 → 角色「使用者:角色:管理員」（該租戶站台管理者）
 *        其後註冊 → 角色「使用者:角色:會員」
 *        不接受呼叫端指定角色（body.角色 一律忽略）
 *   - l2：寫入系統 L2（如建立系統管理員）。
 *        需已認證 JWT 且對 L2「使用者」collection 有寫權限（即超管理者）；
 *        權限不足回 403「沒有權限建立使用者」
 *        角色由呼叫端指定（body.角色，預設「使用者:角色:會員」）
 *
 * tenant 取得順序（僅 l3 需要）：body.tenant → cookie 訪客 JWT → Host header。
 * 系統安裝（setup）不經由此端點，直接以 X-API-Key 操作 L2 資料庫。
 */

import type { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { resolveTenant } from '../../../utils/tenant.ts';
import { getCallerPayload, getAuthenticatedPayload } from '../../../utils/require-auth.ts';
import { checkAccess } from '@dui/framework';
import { accountPool } from '../../../services/account-pool.ts';
import { info, error as logError } from '@dui/util';

export async function POST(c: Context) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: '請求資料格式錯誤' }, 400);
    }

    const 帳號 = typeof body.帳號 === 'string' ? body.帳號.trim() : '';
    const 密碼 = typeof body.密碼 === 'string' ? body.密碼 : '';
    if (!帳號 || !密碼) {
      return c.json({ success: false, error: '帳號與密碼為必填欄位' }, 400);
    }

    // ── 目標層級：預設 L3（網頁註冊一律走 L3）──
    const layer = body.layer === 'l2' ? 'l2' : 'l3';

    // ── 名稱正規化：純字串 → 依請求語言包成 MultilingualString ──
    const lang = (c.get('lang') || 'zh-tw') as string;
    const rawName = body.名稱;
    const 名稱 = typeof rawName === 'string' && rawName.trim()
      ? { [lang]: rawName.trim() }
      : rawName;

    if (layer === 'l2') {
      return await registerL2(c, body, 帳號, 密碼, 名稱);
    }
    return await registerL3(c, body, 帳號, 密碼, 名稱);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('Register', `註冊失敗：${msg}`);
    return c.json({ success: false, error: `註冊失敗：${msg}` }, 500);
  }
}

/** L2 註冊：需已認證 + L2「使用者」寫權限；角色由呼叫端指定 */
async function registerL2(
  c: Context,
  body: Record<string, unknown>,
  帳號: string,
  密碼: string,
  名稱: unknown,
) {
  const payload = await getAuthenticatedPayload(c);
  if (!payload || !checkAccess(payload, 'l2', '使用者', '寫')) {
    return c.json({ success: false, error: '沒有權限建立使用者' }, 403);
  }

  // 角色由呼叫端指定（過濾非字串值；預設會員）
  const 角色 = Array.isArray(body.角色)
    ? (body.角色 as unknown[]).filter((r): r is string => typeof r === 'string')
    : [];
  if (!角色.length) 角色.push('使用者:角色:會員');

  const 密碼雜湊 = await bcrypt.hash(密碼, 10);
  const result = await accountPool.createUser('l2', undefined, {
    id: `使用者:使用者:${帳號}`,
    帳號,
    名稱,
    密碼雜湊,
    角色,
  });
  if (!result.success) {
    return c.json({ success: false, error: result.error || '建立使用者失敗' }, 502);
  }

  await info('Register', `${帳號} 建立成功（L2，角色 ${角色.join('、')}）`);
  return c.json({
    success: true,
    data: { id: result.data?.id ?? `使用者:使用者:${帳號}`, 帳號, 角色 },
  });
}

/** L3 註冊（預設、公開）：首位→管理員、其後→會員；需呼叫端對 L3「使用者」有新增權限 */
async function registerL3(
  c: Context,
  body: Record<string, unknown>,
  帳號: string,
  密碼: string,
  名稱: unknown,
) {
  // 權限門檻：呼叫端（訪客或已認證）需對 L3「使用者」collection 有「新增」權限
  const caller = await getCallerPayload(c);
  if (!caller || !checkAccess(caller, 'l3', '使用者', '新增')) {
    return c.json({ success: false, error: '沒有權限建立使用者' }, 403);
  }

  const tenant = await resolveTenant(c, body.tenant);
  if (!tenant) {
    return c.json({ success: false, error: '無法判定租戶（tenant）' }, 400);
  }

  // ── 1. 確認 L3 存在，並判斷是否為第一位註冊 ──
  // L3 不存在時，data-gateway 會回傳錯誤（不再降級 L2）
  const check = await accountPool.listUsers('l3', tenant, { limit: '1' });
  if (!check.success) {
    return c.json(
      { success: false, error: `租戶 ${tenant} 的 L3 資料庫不存在或未啟用` },
      400,
    );
  }
  const totalCount = (check.pagination as { totalCount?: number } | undefined)?.totalCount;
  const isFirstUser = !totalCount;

  // ── 2. 第一位註冊為管理員，其餘為會員（不接受呼叫端指定角色）──
  const roleId = isFirstUser ? '使用者:角色:管理員' : '使用者:角色:會員';
  const 密碼雜湊 = await bcrypt.hash(密碼, 10);

  // ── 3. 寫入 L3（accountPool 建立成功後會寫入快取）──
  const result = await accountPool.createUser('l3', tenant, {
    id: `使用者:使用者:${帳號}`,
    帳號,
    名稱,
    密碼雜湊,
    角色: [roleId],
  });
  if (!result.success) {
    return c.json({ success: false, error: result.error || '註冊失敗' }, 502);
  }

  await info('Register', `${帳號} 註冊成功（${tenant}，${isFirstUser ? '管理員' : '會員'}）`);
  return c.json({
    success: true,
    data: { id: result.data?.id ?? `使用者:使用者:${帳號}`, 帳號, 角色: [roleId], tenant },
  });
}
