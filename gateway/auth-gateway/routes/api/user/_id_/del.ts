/**
 * DELETE /api/user/:id — 注銷帳號
 *
 * 刪除指定使用者的帳號記錄。依請求者權限決定：
 *   - 超級管理員／管理員 → 可刪除任何使用者
 *   - 一般使用者 → 只能刪除自己的帳號
 *   - 其他 → 403 無權限
 *
 * 透過 accountPool 代理刪除 data-gateway 記錄，同時清除 pool 快取。
 */

import type { Context } from 'hono';
import { accountPool } from '../../../../services/account-pool.ts';
import { checkAccess } from '@dui/framework';

export const DELETE = async (c: Context) => {
  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ success: false, error: '缺少使用者 ID' }, 400);
  }

  // 權限檢查
  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const tenant = payload?.tenant as string | undefined;
  const level = tenant ? 'l3' : 'l2';
  if (!payload || !checkAccess(payload, level, '使用者', '寫', userId)) {
    return c.json({ success: false, error: '無權限刪除此使用者' }, 403);
  }

  try {
    const result = await accountPool.deleteUser(userId, tenant);
    if (!result.success) {
      return c.json({ success: false, error: result.error || '刪除使用者失敗' }, 502);
    }
    return c.json({ success: true, message: '帳號已刪除' });
  } catch (err) {
    return c.json({
      success: false,
      error: `刪除使用者失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};