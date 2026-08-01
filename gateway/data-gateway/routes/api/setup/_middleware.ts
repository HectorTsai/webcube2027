/**
 * /api/setup/* — 安裝流程專用 Middleware
 *
 * 若 L1 已有 l2_connection，表示系統已安裝，拒絕繼續訪問 setup。
 * 避免已安裝系統被重複安裝。
 */

import type { Context, Next } from 'hono';
import { getConfig } from '../../../services/config.ts';

export const middleware = async (c: Context, next: Next) => {
  const connStr = await getConfig().get('l2_connection');
  if (connStr) {
    return c.json({ success: false, error: '系統已安裝，請勿重複安裝' }, 400);
  }
  await next();
};