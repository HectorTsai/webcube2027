/**
 * POST /api/user/change-password — 修改密碼
 *
 * 1. 透過 pool 驗證舊密碼（可命中快取，不用打 data-gateway）
 * 2. 透過 pool 更新密碼（直接寫 data-gateway，成功後失效快取）
 */

import type { Context } from 'hono';
import { accountPool } from '../../../../services/account-pool.ts';
import { checkAccess } from '@dui/framework';

export const POST = async (c: Context) => {
  const userId = c.req.param('id');
  if (!userId) {
    return c.json({ success: false, error: '缺少使用者 ID' }, 400);
  }

  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const tenant = payload?.tenant as string | undefined;
  const level = tenant ? 'l3' : 'l2';
  if (!payload || !checkAccess(payload, level, '使用者', '寫', userId)) {
    return c.json({ success: false, error: '無權限修改此使用者密碼' }, 403);
  }

  let body: { 舊密碼?: string; 新密碼?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: '請求資料格式錯誤' }, 400);
  }

  const { 舊密碼, 新密碼 } = body;
  if (!舊密碼 || !新密碼) {
    return c.json({ success: false, error: '請提供舊密碼與新密碼' }, 400);
  }

  // 取得使用者 帳號（用於 pool 驗證）
  const user = await accountPool.getUserById(userId, tenant);
  if (!user) {
    return c.json({ success: false, error: '使用者不存在' }, 404);
  }

  const 帳號 = user.帳號 as string;

  // 驗證舊密碼（可走 pool 快取）
  const verifyResult = await accountPool.verifyPassword(帳號, 舊密碼, tenant);
  if (!verifyResult.success) {
    return c.json({ success: false, error: '舊密碼錯誤' }, 400);
  }

  // 寫入 data-gateway + 失效 pool 快取
  const updateResult = await accountPool.updateUser(userId, 'PATCH', tenant, {
    密碼: 新密碼,
  } as Record<string, unknown>);
  if (!updateResult.success) {
    return c.json({ success: false, error: '修改密碼失敗，請稍後再試' }, 502);
  }

  return c.json({ success: true, message: '密碼已更新' });
};