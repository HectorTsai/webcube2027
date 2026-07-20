/**
 * API area JWT auth middleware.
 *
 * API client 友善：驗證失敗時回傳 401 JSON，不重新導向。
 */

import { extrairToken, verificarToken } from '../_utils.ts';

export const middleware = async (c: any, next: any) => {
  const token = extrairToken(c);

  if (!token) {
    return c.json({ success: false, error: '未提供認證 token' }, 401);
  }

  const payload = await verificarToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'token 無效或已過期' }, 401);
  }

  // 將 payload 存入 context，供後續 handler 使用
  c.set('jwt_payload', payload);

  await next();
};
