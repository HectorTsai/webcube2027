// deno-lint-ignore-file no-explicit-any
import { Hono } from 'hono';
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
// API 透過動態路由分發器處理，無需直接導入

const app = new Hono();

// 全域中間件：設定 app 實例到 context
app.use('*', (c, next) => {
  (c as any).set('app', app);
  return next();
});

// 全域中間件：資料庫解析器（必須在資訊載入器之前）
app.use('*', 資料庫解析器);

// 全域中間件：資訊載入器（預先載入系統資訊和網站資訊）
app.use('*', 資訊載入器);

// 全域中間件：語言解析器
app.use('*', 語言解析器);

// API 路由由動態路由分發器處理

// 測試頁面 - 驗證 UnoCSS 整合
app.get('/test-unocss', async (c) => {
  try {
    const testHTML = `
      <div class="container mx-auto p-4">
        <h1 class="text-3xl font-bold text-primary mb-4">UnoCSS 測試頁面</h1>
        <div class="card mb-6">
          <h2 class="text-xl font-medium mb-2">測試內容</h2>
          <p class="text-base-content mb-4">這是一個測試 UnoCSS 整合的頁面</p>
          <button class="btn-primary mr-2">主要按鈕</button>
          <button class="btn-secondary">次要按鈕</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="card bg-info text-auto-info">
            <h3 class="font-bold">資訊卡片</h3>
            <p>使用自訂顏色系統</p>
          </div>
          <div class="card bg-success text-auto-success">
            <h3 class="font-bold">成功卡片</h3>
            <p>OKLCH 顏色格式</p>
          </div>
          <div class="card bg-warning text-auto-warning">
            <h3 class="font-bold">警告卡片</h3>
            <p>響應式佈局</p>
          </div>
        </div>
      </div>
    `;

    // 生成對應的 CSS
    const css = await 產生樣式(testHTML);
    
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UnoCSS 測試</title>
        <style>
          ${css}
          
          /* CSS Variables for theme */
          :root {
            --primary: oklch(0.7 0.15 260);
            --secondary: oklch(0.6 0.12 290);
            --accent: oklch(0.65 0.2 150);
            --info: oklch(0.7 0.15 200);
            --success: oklch(0.7 0.15 120);
            --warning: oklch(0.8 0.15 80);
            --error: oklch(0.7 0.2 25);
            --base-100: oklch(0.95 0.01 260);
            --base-content: oklch(0.2 0.02 260);
          }
        </style>
      </head>
      <body class="bg-base-100">
        ${testHTML}
      </body>
      </html>
    `;

    await info('測試頁面', 'UnoCSS 測試頁面已生成');
    return c.html(fullHTML);
    
  } catch (錯誤) {
    await error('測試頁面', `UnoCSS 測試失敗: ${錯誤}`);
    return c.text(`UnoCSS 測試失敗: ${錯誤}`, 500);
  }
});

// 動態路由分發器 - 第三階段核心功能
app.all('*', async (c) => {
  const path = c.req.path;
  
  try {
    // 導入服務處理器
    const { 處理API請求 } = await import('./services/apiService/index.ts');
    const { 處理Media請求 } = await import('./services/mediaService/index.ts');
    const { 處理Renderer請求 } = await import('./services/rendererService/index.ts');
    
    // 路由分發邏輯
    if (path.startsWith('/api/')) {
      // API 服務
      return await 處理API請求(c);
    } else if (path.startsWith('/medias/')) {
      // Media 服務
      return await 處理Media請求(c);
    } else {
      // Renderer 服務 (處理所有其他請求)
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

// 內部調用測試路由
app.get('/test-internal-call', async (c) => {
  try {
    await info('內部調用測試', '開始測試內部調用');
    
    // 測試內部調用 API
    const response = await app.request('/api/v1/system/info', {
      headers: {
        'host': c.req.header('host') || 'localhost:8000'
      }
    });
    
    const data = await response.json();
    
    const testHTML = `
      <div class="container mx-auto p-4">
        <h1 class="text-2xl font-bold mb-4">內部調用測試結果</h1>
        <div class="card">
          <h2 class="text-lg font-medium mb-2">API 回應狀態: ${response.status}</h2>
          <pre class="bg-base-200 p-4 rounded text-sm overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    `;
    
    const css = await 產生樣式(testHTML);
    
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>內部調用測試</title>
        <style>
          ${css}
          :root {
            --primary: oklch(0.7 0.15 260);
            --base-100: oklch(0.95 0.01 260);
            --base-200: oklch(0.9 0.02 260);
            --base-content: oklch(0.2 0.02 260);
          }
        </style>
      </head>
      <body class="bg-base-100">
        ${testHTML}
      </body>
      </html>
    `;
    
    await info('內部調用測試', '內部調用測試完成');
    return c.html(fullHTML);
    
  } catch (錯誤) {
    await error('內部調用測試', `內部調用測試失敗: ${錯誤}`);
    return c.text(`內部調用測試失敗: ${錯誤}`, 500);
  }
});

// 三層查詢測試 API
app.get('/api/v1/test/three-tier', async (c) => {
  try {
    await info('三層查詢測試', '開始測試三層查詢功能');
    
    const host = c.get('host');
    const tenant = c.get('tenant');
    const l1DB = c.get('kvDB');
    const l2DB = c.get('l2DB');
    const l3DB = c.get('l3DB');
    
    // 測試結果
    const 測試結果 = {
      基本資訊: {
        host,
        tenant,
        可用層級: {
          L1_KV: !!l1DB,
          L2_System: !!l2DB,
          L3_Tenant: !!l3DB
        }
      },
      查詢測試: {} as any
    };
    
    // 測試 1: 取得骨架預設值
    const 骨架結果 = await 三層查詢管理器.取得預設值<骨架>(c, '骨架');
    測試結果.查詢測試.骨架預設值 = {
      success: 骨架結果.success,
      source: 骨架結果.source,
      data: 骨架結果.data ? {
        id: 骨架結果.data.id,
        名稱: 骨架結果.data.名稱,
        風格: 骨架結果.data.風格
      } : null,
      error: 骨架結果.error
    };
    
    // 測試 2: 取得配色預設值
    const 配色結果 = await 三層查詢管理器.取得預設值<配色>(c, '配色');
    測試結果.查詢測試.配色預設值 = {
      success: 配色結果.success,
      source: 配色結果.source,
      data: 配色結果.data ? {
        id: 配色結果.data.id,
        名稱: 配色結果.data.名稱,
        主色: 配色結果.data.主色
      } : null,
      error: 配色結果.error
    };
    
    // 測試 3: 查詢骨架列表
    const 骨架列表 = await 三層查詢管理器.查詢列表<骨架>(c, '骨架', 5);
    測試結果.查詢測試.骨架列表 = {
      success: 骨架列表.success,
      source: 骨架列表.source,
      data: 骨架列表.data?.map(item => ({
        id: item.id,
        名稱: item.名稱,
        風格: item.風格
      })) || [],
      error: 骨架列表.error
    };
    
    await info('三層查詢測試', '測試完成');
    return c.json({
      success: true,
      message: '三層查詢測試完成',
      data: 測試結果
    });
    
  } catch (錯誤) {
    await error('三層查詢測試', `測試失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '三層查詢測試失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
});

app.get('/test-internal-call', async (c) => {
  try {
    await info('內部調用測試', '開始測試內部調用');
    
    // 測試內部調用 API
    const response = await app.request('/api/v1/system/info', {
      headers: {
        'host': c.req.header('host') || 'localhost:8000'
      }
    });
    
    const data = await response.json();
    
    const testHTML = `
      <div class="container mx-auto p-4">
        <h1 class="text-2xl font-bold mb-4">內部調用測試結果</h1>
        <div class="card">
          <h2 class="text-lg font-medium mb-2">API 回應狀態: ${response.status}</h2>
          <pre class="bg-base-200 p-4 rounded text-sm overflow-auto">${JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    `;
    
    const css = await 產生樣式(testHTML);
    
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>內部調用測試</title>
        <style>
          ${css}
          :root {
            --primary: oklch(0.7 0.15 260);
            --base-100: oklch(0.95 0.01 260);
            --base-200: oklch(0.9 0.02 260);
            --base-content: oklch(0.2 0.02 260);
          }
        </style>
      </head>
      <body class="bg-base-100">
        ${testHTML}
      </body>
      </html>
    `;
    
    await info('內部調用測試', '內部調用測試完成');
    return c.html(fullHTML);
    
  } catch (錯誤) {
    await error('內部調用測試', `內部調用測試失敗: ${錯誤}`);
    return c.text(`內部調用測試失敗: ${錯誤}`, 500);
  }
});

// 健康檢查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 初始化並啟動伺服器
async function 啟動伺服器() {
  try {
    // 初始化 KV 資料庫
    const kvDB = 取得KV資料庫();
    await kvDB.初始化();
    await info('伺服器', 'KV 資料庫初始化完成');
    
    // 初始化 UnoCSS
    await 初始化UnoCSS();
    await info('伺服器', 'UnoCSS 初始化完成');
    
    // 啟動伺服器
    const port = 8000;
    await info('伺服器', `伺服器啟動於 http://localhost:${port}`);
    await info('伺服器', `UnoCSS 測試頁面: http://localhost:${port}/test-unocss`);
    await info('伺服器', `內部調用測試頁面: http://localhost:${port}/test-internal-call`);
    await info('伺服器', `系統資訊 API: http://localhost:${port}/api/v1/system/info`);
    await info('伺服器', `三層查詢測試 API: http://localhost:${port}/api/v1/test/three-tier`);
    
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
