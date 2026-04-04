// deno-lint-ignore-file no-explicit-any
import { Hono } from "hono";
import { jsx } from "hono/jsx";
import { 初始化UnoCSS, 產生樣式 } from './core/unocss.ts';
import { 取得KV資料庫 } from './core/kv.ts';
import { info, error } from './utils/logger.ts';
import { 加密, 解密 } from './utils/密碼方法.ts';
// 移除已刪除的 system.ts 導入
import { 資料庫解析器, 清理資料庫連線 } from './middleware/db-resolver.ts';
import { 資訊載入器 } from './middleware/info-loader.ts';
import { 語言解析器 } from './middleware/language-resolver.ts';
import { 三層查詢管理器 } from './core/three-tier-query.ts';
import 骨架 from './database/models/骨架.ts';
import 配色 from './database/models/配色.ts';
import { 處理API請求 } from "./services/apiService/index.ts";
import { 處理Media請求 } from "./services/mediaService/index.ts";
import { 處理Renderer請求 } from './services/rendererService/index.ts';

// API 透過動態路由分發器處理，無需直接導入

const app = new Hono();

// 全域中間件：設定 app 實例到 context (必須要有)
app.use('*', (c, next) => {
  (c as any).set('app', app);
  return next();
});

// 全域中間件：資料庫解析器（必須在資訊載入器之前）
app.use('*', 資料庫解析器);

// 全域中間件：資訊載入器（預先載入系統資訊和網站資訊）
app.use('*', 資訊載入器);

// 測試路由
app.get('/test', async (c) => {
  const { 產生樣式 } = await import('./core/unocss.ts');
  const { default: TestPage } = await import('./test.tsx');
  
  // 獲取 JSX 內容
  const jsxContent = await TestPage();
  
  // 使用 Hono 的 jsxToHTML 方法轉換
  const htmlContent = String(jsxContent);
  
  console.log('HTML 內容:', htmlContent);
  
  // 產生 UnoCSS 樣式
  const css = await 產生樣式(htmlContent);
  
  console.log('生成的 CSS:', css);
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebCube Alpine.js 測試</title>
        <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.10.2/dist/cdn.min.js" defer></script>
        <style>${css}</style>
        <style>
            /* 基礎樣式 - 只保留必要的 */
            body {
                font-family: system-ui, -apple-system, sans-serif;
                margin: 0;
                padding: 2rem;
                background: #f5f5f5;
            }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
  `);
});

// 全域中間件：語言解析器（必須在資訊載入器之後）
app.use('*', 語言解析器);

// API 路由由動態路由分發器處理

// 全域請求攔截器
app.all('*', (c, next) => {
  return next();
});

// 健康檢查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 動態路由分發器 - 第三階段核心功能 (必須是最後一個路由)
app.all('*', async (c) => {
  const path = c.req.path;
  const method = c.req.method;
  
  
  // 記錄路由日誌
  // await info('路由分發器', `${method} ${path}`);
  
  try {
    // await info('路由分發器', `服務處理器導入完成`);
    
    // 路由分發邏輯
    if (path.startsWith('/api/')) {
      // API 服務
      // await info('路由分發器', `分發到 API 服務: ${path}`);
      return await 處理API請求(c);
    } else if (path.startsWith('/media/')) {
      // Media 服務 (包含 /media/v1/, /media/script/, /medias/)
      // await info('路由分發器', `分發到 Media 服務: ${path}`);
      return await 處理Media請求(c);
    } else {
      // Renderer 服務 (處理所有其他請求)
      // await info('路由分發器', `分發到 Renderer 服務: ${path}`);
      return await 處理Renderer請求(c);
    }
    
  } catch (錯誤) {
    await error('路由分發器', `路由分發失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '路由分發失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
});

// 初始化並啟動伺服器
async function 啟動伺服器() {
  try {
    // 初始化 KV 資料庫
    const kvDB = 取得KV資料庫();
    await kvDB.初始化();
    // await info('伺服器', 'KV 資料庫初始化完成');
    
    // 初始化 UnoCSS
    await 初始化UnoCSS();
    // await info('伺服器', 'UnoCSS 初始化完成');
    
    // 啟動伺服器
    const port = 8000;
    // await info('伺服器', `伺服器啟動於 http://localhost:${port}`);
    // await info('伺服器', `UnoCSS 測試頁面: http://localhost:${port}/test-unocss`);
    // await info('伺服器', `內部調用測試頁面: http://localhost:${port}/test-internal-call`);
    // await info('伺服器', `系統資訊 API: http://localhost:${port}/api/v1/system/info`);
    // await info('伺服器', `三層查詢測試 API: http://localhost:${port}/api/v1/test/three-tier`);
    
    Deno.serve({ port }, app.fetch);
    
  } catch (錯誤) {
    await error('伺服器', `伺服器啟動失敗: ${錯誤}`);
    Deno.exit(1);
  }
}

// 如果直接執行此檔案，則啟動伺服器
if (import.meta.main) {
  啟動伺服器();
}
