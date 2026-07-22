// routes/_middleware.ts
import type { Context, Next } from 'hono';
import { dataPool } from '@dui/database';

export async function middleware(c: Context, next: Next) {
  const path = c.req.path;

  // 1. 靜態資源與公開端點直接放行
  const isPublic =
    path.startsWith('/css/') ||
    path.startsWith('/images/') ||
    path.startsWith('/favicon') ||
    path === '/api/setup' ||
    /\.(css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(path);

  if (isPublic) {
    return await next();
  }

  // 2. 動態判斷系統是否已安裝 (L2 就緒)
  const isInstalled = dataPool.System !== undefined && dataPool.System !== null;

  // 3. 寫入 Context，讓底下的所有 Handler / Middleware 都可以存取
  c.set('已安裝', isInstalled);

  // 4. 未安裝時：只有 /setup 相關路徑可存取
  if (!isInstalled && !path.startsWith('/setup')) {
    if (path.startsWith('/api') || path.startsWith('/inner-api')) {
      return c.json({ success: false, message: '系統尚未安裝，請先前往 /setup' }, 403);
    }
    return c.redirect('/setup');
  }

  // 5. 其他狀況（已安裝，或正在訪問 /setup）直接放行
  return await next();
}