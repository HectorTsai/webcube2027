/**
 * 認證與權限檢查共用工具
 *
 * 供各 API 目錄的 `_middleware.ts` 使用：
 *   - `getAuthenticatedPayload()`：讀取並驗證 JWT，回傳已認證 payload
 *   - `requireCollectionRead()`：要求已認證 + 對指定 collection 有讀權限
 *
 * 權限判定委託 `@dui/framework` 的 `checkAccess()`（依角色權限表 PermissionMap）。
 */

import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { extractToken } from '@dui/util/jwt';
import { checkAccess } from '@dui/framework';
import { getKeys } from './keys.ts';

/**
 * 從請求讀取並驗證 JWT（Authorization Bearer 或 jwt cookie）
 *
 * @returns 已認證的 payload（type === 'authenticated'）；未登入／token 無效回 null
 */
export async function getAuthenticatedPayload(
  c: Context,
): Promise<Record<string, unknown> | null> {
  const token = extractToken(c);
  if (!token) return null;

  try {
    const { publicKey } = getKeys();
    const payload = await verify(token, publicKey, 'EdDSA') as Record<string, unknown>;
    // 訪客 JWT（type: 'visitor'）不視為已認證使用者，交由權限檢查決定
    return payload?.type === 'authenticated' ? payload : null;
  } catch {
    return null;
  }
}

/**
 * 要求「已認證 + 指定 collection 讀權限」的 middleware factory
 *
 * @param collection collection 名稱（如 '使用者'——角色 model 亦屬此 collection）
 * @param level 檢查層級（預設 l2）
 */
export function requireCollectionRead(
  collection: string,
  level: 'l2' | 'l3' = 'l2',
) {
  return async function middleware(c: Context, next: Next) {
    const payload = await getAuthenticatedPayload(c);
    if (!payload) {
      return c.json({ success: false, error: '請先登入' }, 401);
    }
    if (!checkAccess(payload, level, collection, '讀')) {
      return c.json({ success: false, error: '無權限存取此資源' }, 403);
    }
    // 注入已驗證 payload，供後續 handler 使用
    c.set('jwt_payload', payload);
    await next();
  };
}
