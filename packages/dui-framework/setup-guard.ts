/**
 * 安裝檢查 Middleware — 系統未安裝時只開放特定路徑，其餘導向 /setup
 *
 * fileRouter 服務的靜態資源路徑（CSS、圖片等）已自動納入公開清單。
 *
 * @example
 * ```ts
 * import { 創建安裝檢查 } from '@dui/framework/setup-guard';
 *
 * let 已安裝 = false;
 * app.use('*', 創建安裝檢查(() => 已安裝, ['/admin', '/api/admins']));
 * ```
 */
export function 創建安裝檢查(
  /** 回傳當前是否已安裝 */
  已安裝: () => boolean,
  /** 額外公開路徑前綴（不需要登入/安裝的頁面） */
  額外公開路徑: string[] = [],
  /** 未安裝時導向的路徑（預設 /setup） */
  安裝路徑 = '/setup',
  /** 已安裝時從安裝頁導向的路徑（預設 /admin） */
  已安裝首頁 = '/admin',
) {
  // 預設公開路徑 — 這些在系統未安裝時仍然可存取
  const 預設公開 = [
    '/setup',
    '/login',
    '/css/',
    '/images/',
    '/health',
    '/api/login',
    '/api/verify',
    '/api/setup',
    '/favicon',
  ];

  const 公開路徑 = [...預設公開, ...額外公開路徑];

  return async (c: any, next: any) => {
    if (已安裝()) {
      // 已安裝時若訪問安裝頁，導向首頁
      if (c.req.path === 安裝路徑) return c.redirect(已安裝首頁);
      return next();
    }

    const path = c.req.path;
    const 是公開 = 公開路徑.some((p) => path === p || path.startsWith(p));
    if (是公開) return next();

    return c.redirect(安裝路徑);
  };
}
