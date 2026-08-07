/**
 * PUT /api/user/:id — 更新使用者資訊（完整取代）
 *
 * 權限：超級管理員／管理員可更新任何使用者；一般使用者只能更新自己的資料。
 * 透過 accountPool 代理寫入 data-gateway。
 */

import type { Context } from 'hono';
import { accountPool } from '../../../../services/account-pool.ts';
import { checkAccess } from '@dui/framework';

export const PUT = async (c: Context) => {
  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ success: false, error: '缺少使用者 ID' }, 400);
  }

  // 權限檢查
  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const tenant = payload?.tenant as string | undefined;
  const level = tenant ? 'l3' : 'l2';
  if (!payload || !checkAccess(payload, level, '使用者', '寫', userId)) {
    return c.json({ success: false, error: '無權限更新此使用者' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: '請求資料格式錯誤' }, 400);
  }

  try {
    const result = await accountPool.updateUser(userId, 'PUT', tenant, body);
    if (!result.success) {
      return c.json({ success: false, error: result.error || '更新使用者失敗' }, 502);
    }
    return c.json({ success: true, data: result.data });
  } catch (err) {
    return c.json({
      success: false,
      error: `更新使用者失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};