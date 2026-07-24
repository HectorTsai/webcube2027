/**
 * 根中介層 — 安裝檢查
 *
 * 若 auth-gateway 尚未設定（L1 中無 data_gateway_url）：
 *   - `/setup`、`/api/setup`、`/api/anonymous-token`、靜態資源 → 放行
 *   - 其他 API → 回傳 403
 *   - 其他頁面 → 重新導向到 `/setup`
 */

import type { Context, Next } from 'hono';
import { getL1 } from '../utils/l1.ts';

/** 不需安裝即可存取的公開路徑前綴 */
const PUBLIC_PREFIXES = ['/setup', '/css/', '/images/', '/favicon'];
/** 不需安裝即可存取的 API 路徑 */
const PUBLIC_API_PATHS = ['/api/setup', '/api/anonymous-token'];

export async function middleware(c: Context, next: Next) {
  const path = c.req.path;

  // 1. 公開路徑直接放行
  const isPublic =
    PUBLIC_PREFIXES.some((p) => path.startsWith(p)) ||
    PUBLIC_API_PATHS.includes(path) ||
    /\.(css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(path);

  if (isPublic) {
    return await next();
  }

  // 2. 檢查安裝狀態
  const l1 = getL1();
  const dataGatewayUrl = await l1.get('data_gateway_url');

  if (!dataGatewayUrl) {
    // 未安裝：API 回傳 403，頁面重新導向
    if (path.startsWith('/api/')) {
      return c.json({ success: false, error: 'auth-gateway 尚未安裝，請先完成 /setup' }, 403);
    }
    return c.redirect('/setup');
  }

  // 3. 已安裝
  c.set('已安裝', true);
  return await next();
}