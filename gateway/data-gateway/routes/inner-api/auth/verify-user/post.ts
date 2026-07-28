/**
 * POST /inner-api/auth/verify-user
 * 驗證使用者帳號密碼（供 auth-gateway 內部調用）
 *
 * 搜尋順序：
 *   1. L2（超級管理員）
 *   2. L3（站台管理員，需提供 tenant）
 */

import type { Context } from 'hono';
import { dataPool } from '@dui/database';
import { mergePermissions } from '../../../../utils/permission.ts';

/** 從角色 ID 清單取得各角色的權限並合併 */
async function getRolePermissions(roleIds: string[]): Promise<Record<string, unknown>> {
  const system = dataPool.System;
  if (!system || !roleIds?.length) return {};

  const roles: Record<string, unknown>[] = [];
  for (const roleId of roleIds) {
    try {
      const role = await system.getById(roleId);
      if (role) roles.push(role);
    } catch {
      // 角色不存在則跳過
    }
  }

  return mergePermissions(roles) as unknown as Record<string, unknown>;
}

function formatUserResponse(user: any) {
  return {
    id: user.id,
    帳號: user.帳號,
    角色: user.角色 ?? [],
    layer: user._layer || 'L2',
  };
}

export async function POST(c: Context) {
  try {
    const { 帳號, 密碼, tenant } = await c.req.json();
    const bcrypt = (await import('bcryptjs')) as any;

    // ── 1. 先查 L2（超級管理員） ──
    const system = dataPool.System;
    if (!system) {
      return c.json({ success: false, error: '資料庫尚未初始化' }, 500);
    }

    const l2Users = await system.queryByField('使用者', { field: '帳號', value: 帳號 }, '使用者');
    const l2User = l2Users?.[0];
    if (l2User) {
      const match = await bcrypt.default.compare(密碼, l2User.密碼雜湊 as string);
      if (!match) return c.json({ success: false, error: '帳號或密碼錯誤' });

      const 權限 = await getRolePermissions(l2User.角色 as string[]);
      return c.json({
        success: true,
        data: { ...formatUserResponse(l2User), _layer: 'L2', 權限 },
      });
    }

    // ── 2. 查不到 + 有 tenant → 查 L3（站台管理員） ──
    if (tenant) {
      const l3Result = await dataPool.list(
        '使用者', '使用者',
        { filter: { 帳號 }, limit: 1, offset: 0 },
        tenant,
      );
      const l3User = l3Result.data?.[0];
      if (l3User) {
        const match = await bcrypt.default.compare(密碼, l3User.密碼雜湊 as string);
        if (!match) return c.json({ success: false, error: '帳號或密碼錯誤' });

        const 權限 = await getRolePermissions(l3User.角色 as string[]);
        return c.json({
          success: true,
          data: { ...formatUserResponse(l3User), _layer: 'L3', 權限 },
        });
      }
    }

    // ── 3. 都找不到 ──
    return c.json({ success: false, error: '帳號或密碼錯誤' });
  } catch (err) {
    return c.json(
      { success: false, error: `驗證失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}
