// deno-lint-ignore-file no-explicit-any
import { Hono } from "hono";
import { 初始化UnoCSS } from './unocss/unocss.ts';
import { info, error } from './utils/logger.ts';
import { 資料池 } from './database/資料池.ts';
import { 設定App } from "./services/index.ts";
import { 處理API請求 } from "./services/apiService/index.ts";
import { 處理Media請求 } from "./services/mediaService/index.ts";
import { 處理Renderer請求 } from './services/rendererService/index.ts';
import { 處理測試請求 } from './services/testService.ts';
import { 處理AI請求 } from './services/aiService/index.ts';
import { registerTranslation } from '@dui/smartmultilingual';
import { TranslationAdapter } from './services/aiService/translation-adapter.ts';

const app = new Hono();

// ── Hono 原生錯誤處理（替代 middleware try/catch）──
app.onError((err, c) => {
  error('全域錯誤', String(err));
  return c.json({
    success: false,
    message: '伺服器內部錯誤',
    error: err instanceof Error ? err.message : String(err)
  }, 500);
});

// 健康檢查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 動態路由分發器 ──
app.all('*', async (c) => {
  const path = c.req.path;

  try {
    switch (true) {
      case path.startsWith('/test'):
        return await 處理測試請求(c);
      case path.startsWith('/api/v1/ai'):
        return await 處理AI請求(c);
      case path.startsWith('/api'):
        return await 處理API請求(c);
      case path.startsWith('/media'):
        return await 處理Media請求(c);
      default:
        return await 處理Renderer請求(c);
    }
  } catch (err) {
    await error('路由分發器', `路由分發失敗: ${err}`);
    return c.json({
      success: false,
      message: '路由分發失敗',
      error: (err as Error).toString()
    }, 500);
  }
});

// ── 啟動伺服器 ──
async function 啟動伺服器() {
  try {
    // 1. 資料庫初始化（L1 + L2）
    await 資料池.初始化();    // L1 連線 + seed + 定時器
    await 資料池.初始化L2();  // L2 連線（從 L1 讀取連線資訊）
    // L3 懶載入：資料池內部自動在首次查詢時初始化

    // 2. InnerAPI 內部路由依賴（模組層級注入，替代 middleware c.set('app')）
    設定App(app);

    // 3. 註冊翻譯服務
    registerTranslation(new TranslationAdapter());

    // 4. UnoCSS
    await 初始化UnoCSS();

    // 5. 啟動 HTTP 伺服器
    Deno.serve({ port: 8000 }, app.fetch);

  } catch (err) {
    await error('伺服器', `啟動失敗: ${err}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  啟動伺服器();
}
