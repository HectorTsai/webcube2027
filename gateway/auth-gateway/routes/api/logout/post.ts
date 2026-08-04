/**
 * POST /api/logout — 登出（API 形式）
 *
 * 供其他 Gateway / WebCube 以程式方式呼叫。瀏覽器登出連結使用 GET 形式
 * （GET /api/logout）以支援跨域導航。
 */

import type { Context } from 'hono';
import { logoutHandler } from './handler.ts';

export async function POST(c: Context) {
  return logoutHandler(c);
}
