// routes/_middleware.ts
import type { Context, Next } from 'hono';
import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';

/**
 * 判斷系統是否已安裝（L1 中有 l2_connection 記錄）。
 * 不依賴 L2 當前是否連線，而是檢查 L1 設定檔。
 */
async function isInstalled(): Promise<boolean> {
  const connStr = await dataPool.config?.get('l2_connection');
  return !!connStr;
}

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

  // 2. 檢查 L1 是否有安裝記錄
  const 已安裝Flag = await isInstalled();

  if (!已安裝Flag) {
    // 未安裝：只有 /setup 相關路徑可存取
    if (!path.startsWith('/setup')) {
      if (path.startsWith('/api') || path.startsWith('/inner-api')) {
        return c.json({ success: false, message: '系統尚未安裝，請先前往 /setup' }, 403);
      }
      return c.redirect('/setup');
    }
    c.set('已安裝', false);
    return await next();
  }

  // 3. 已安裝，檢查 L2 是否在線，不在則嘗試重連
  if (!dataPool.System) {
    await error('Middleware', 'L2 連線已中斷，嘗試重新連線…');
    try {
      await dataPool.initL2();
    } catch (err) {
      await error('Middleware', `L2 重連失敗：${err}`);
    }
    if (!dataPool.System) {
      await error('Middleware', 'L2 仍無法連線，以降級模式繼續服務');
    } else {
      await info('Middleware', 'L2 已成功重新連線');
    }
  }

  c.set('已安裝', true);
  return await next();
}