/**
 * GET /api/logout — 登出（瀏覽器導航形式）
 *
 * 登出連結（如 data-gateway navbar）以 <a href> 導航至此端點。
 * 清除 auth-gateway 自身 cookie 後依 redirect 參數導回原頁，
 * 並協調 data-gateway 同步清除其自身網域的 cookie。
 */

import type { Context } from 'hono';
import { logoutHandler } from './handler.ts';

export async function GET(c: Context) {
  return logoutHandler(c);
}
