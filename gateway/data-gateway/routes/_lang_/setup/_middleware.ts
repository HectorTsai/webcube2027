// routes/setup/_middleware.ts
import type { Context, Next } from 'hono';

export async function middleware(c: Context, next: Next) {
  // 1. 直接讀取最外層 routes/_middleware.ts 寫入的 Context 變數
  const isInstalled = c.get('已安裝');

  // 2. 如果系統已經安裝完成，禁止任何進入 /setup 的請求！
  if (isInstalled) {
    const path = c.req.path;

    // 如果是 API 請求 (例如 POST /setup)，回傳 JSON 錯誤訊息
    if (c.req.method !== 'GET' || path.startsWith('/api')) {
      return c.json({ success: false, message: '系統已完成安裝，禁止重複設定！' }, 400);
    }

    // 瀏覽器存取 /setup 頁面 → 重導回首頁（管理後台頁面已於 1.5.0 移除）
    const lang = c.get('lang') || 'zh-tw';
    return c.redirect(`/${lang}/`);
  }

  // 3. 還沒安裝才放行進入 /setup 相關頁面/API
  return await next();
}