/**
 * POST /inner-api/auth/verify-user
 * 驗證使用者帳號密碼（供 auth-gateway 內部調用）
 */

import type { Context } from 'hono';
import { dataPool } from '@dui/database';

export async function POST(c: Context) {
  try {
    const { 帳號, 密碼 } = await c.req.json();
    const system = dataPool.System;
    if (!system) {
      return c.json({ success: false, error: '資料庫尚未初始化' }, 500);
    }

    const users = await system.queryByField('使用者', { field: '帳號', value: 帳號 }, '使用者');
    const user = users?.[0];
    if (!user) return c.json({ success: false, error: '帳號或密碼錯誤' });

    const bcrypt = (await import('bcryptjs')) as any;
    const match = await bcrypt.default.compare(密碼, user.密碼雜湊 as string);
    if (!match) return c.json({ success: false, error: '帳號或密碼錯誤' });

    return c.json({
      success: true,
      data: {
        id: user.id,
        帳號: user.帳號,
        角色: user.角色 ?? [],
      },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `驗證失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}
