/**
 * POST /api/register — 租戶公開註冊
 *
 * 規則：
 *   - 一律寫入 L3（租戶資料庫，如 Firestore）；L3 不存在（網站未啟用租戶資料庫）→ 回傳錯誤
 *   - L3 第一位註冊 → 角色「使用者:角色:管理員」（該租戶站台管理者）
 *   - 其後註冊 → 角色「使用者:角色:會員」
 *   - 不接受呼叫端指定角色（body.角色 一律忽略）
 *
 * tenant 取得順序：body.tenant → cookie 訪客 JWT → Host header。
 * 系統安裝（setup）不經由此端點，直接操作 L2 資料庫。
 */

import type { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { resolveTenant } from '../../../utils/tenant.ts';
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logError('Register', `註冊失敗：${msg}`);
    return c.json({ success: false, error: `註冊失敗：${msg}` }, 500);
  }
}
