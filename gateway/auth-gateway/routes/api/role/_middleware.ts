/**
 * GET /api/role* — middleware
 *
 * 確認使用者已認證並將 JWT payload 附加至 context。
 * 角色資料無敏感資訊，不需額外讀權限檢查。
 */

import type { Context } from 'hono';
import { getAuthenticatedPayload } from '../../../utils/require-auth.ts';

export const middleware = async (c: Context, next: () => Promise<void>) => {
  const payload = await getAuthenticatedPayload(c);
  if (!payload) {
    return c.json({ success: false, error: '未授權，請重新登入' }, 401);
  }
  c.set('jwt_payload', payload);
  await next();
};
