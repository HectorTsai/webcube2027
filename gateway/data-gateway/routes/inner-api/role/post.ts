/**
 * POST /inner-api/role
 * 查詢角色資料（含權限），供 auth-gateway 內部調用
 *
 * 用於訪客 JWT 端點取得訪客角色的權限設定。
 */

import type { Context } from 'hono';
import { getDbManager } from '../../../services/db-manager.ts';

export async function POST(c: Context) {
  try {
    const { id } = await c.req.json();
    if (!id || typeof id !== 'string') {
      return c.json({ success: false, error: '請提供角色 ID' }, 400);
    }

    const system = getDbManager().System;
    if (!system) {
      return c.json({ success: false, error: '資料庫尚未初始化' }, 500);
    }

    const role = await system.getById(id);
    if (!role) {
      return c.json({ success: false, error: '角色不存在' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: role.id,
        名稱: role.名稱,
        權限: role.權限 || {},
      },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}