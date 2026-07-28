/**
 * GET /api/me
 * 回傳目前登入使用者的資訊（從 JWT cookie 解碼）
 *
 * 若未登入或為訪客，回傳 { authenticated: false, auth_gateway_url }
 * 已登入回傳 { authenticated: true, 帳號, 角色, tenant, auth_gateway_url }
 */

import type { Context } from 'hono';
import { dataPool } from '@dui/database';
import { extractToken, verifyToken } from '@dui/util/jwt';

export const GET = async (c: Context) => {
  // 取得 auth-gateway URL（供前端登入按鈕使用），不論是否登入皆回傳
  let authGatewayUrl = '';
  try {
    const stored = await dataPool.config?.get('auth_gateway_url');
    if (stored) authGatewayUrl = stored;
  } catch { /* ignore */ }

  const token = extractToken(c);

  if (!token) {
    return c.json({
      authenticated: false,
      auth_gateway_url: authGatewayUrl || undefined,
    });
  }

  const payload = await verifyToken(token);
  // 無效 token 或非已認證 token → 視為未登入
  if (!payload || payload.type !== 'authenticated') {
    return c.json({
      authenticated: false,
      auth_gateway_url: authGatewayUrl || undefined,
    });
  }

  return c.json({
    authenticated: true,
    帳號: payload.帳號,
    角色: payload.角色,
    tenant: payload.tenant,
    auth_gateway_url: authGatewayUrl || undefined,
  });
};
