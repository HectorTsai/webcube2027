/**
 * setup 頁面中介層 — 設定「安裝模式」標記
 */
import type { Context, Next } from 'hono';

export const middleware = async (c: Context, next: Next) => {
  c.set('setup_mode', true);
  return await next();
};