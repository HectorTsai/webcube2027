/**
 * /api/l2/* — 超管專用 L2 操作 API
 *
 * 限定超級管理員存取，effective_host = undefined（操作 L2 系統資料庫）。
 */

import type { Context, Next } from 'hono';
import { extractToken, verifyToken } from '@dui/util/jwt';

const 超級管理員角色 = '使用者:角色:超級管理員';

function 是超級管理員(payload: any): boolean {
  // 優先支援中文 key「角色」，次要支援英文 key「roles」
  const roles = payload.角色 ?? payload.roles;
  if (!roles) return false;
  if (Array.isArray(roles)) return roles.includes(超級管理員角色);
  return roles === 超級管理員角色;
}

export const middleware = async (c: Context, next: Next) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ success: false, error: '請先登入' }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'Token 無效或已過期' }, 401);
  }

  if (!是超級管理員(payload)) {
    return c.json({ success: false, error: '僅超級管理員可存取' }, 403);
  }

  // 超管操作 L2（系統資料庫）
  c.set('jwt_payload', payload);
  c.set('effective_host', undefined);

  await next();
};