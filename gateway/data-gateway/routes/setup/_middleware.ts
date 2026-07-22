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

    // 如果是瀏覽器存取 /setup 頁面，直接重定向回首頁或管理後台
    return c.redirect('/admin');
  }

  // 3. 還沒安裝才放行進入 /setup 相關頁面/API
  return await next();
}