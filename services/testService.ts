// Test Service - 測試頁面路由服務
import { Context } from 'hono';
import { 產生樣式 } from '../core/unocss.ts';
import { error } from '../utils/logger.ts';

/**
 * 處理測試頁面請求
 * 負責將 /test/xxxx 路由對應到 .test/xxxx.tsx 檔案
 */
export async function 處理測試請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    // 只處理 GET 請求
    if (method !== 'GET') {
      return c.json({
        success: false,
        message: 'Test Service 只支援 GET 請求',
        error: 'METHOD_NOT_ALLOWED'
      }, 405);
    }
    
    // 提取測試檔案名稱
    // /test/button -> button
    // /test/ -> 預設頁面
    const match = path.match(/^\/test\/?(.*)$/);
    if (!match) {
      return await 渲染測試404頁面(c, path);
    }
    
    const 測試名稱 = match[1] || 'index';
    
    // 載入對應的測試檔案
    return await 渲染測試頁面(c, 測試名稱);
    
  } catch (錯誤) {
    await error('Test Service', `測試頁面渲染失敗: ${錯誤}`);
    return await 渲染測試錯誤頁面(c, 錯誤);
  }
}

/**
 * 渲染測試頁面
 */
async function 渲染測試頁面(c: Context, 測試名稱: string): Promise<Response> {
  try {
    // 嘗試載入測試檔案
    let 測試模組;
    try {
      // 嘗試從 .test 目錄載入
      測試模組 = await import(`../.test/${測試名稱}.tsx`);
    } catch (_e) {
      // 如果 .test 目錄不存在，嘗試從 test 目錄載入
      try {
        測試模組 = await import(`../test/${測試名稱}.tsx`);
      } catch (_e2) {
        // 兩個目錄都不存在，返回 404
        return await 渲染測試404頁面(c, `/test/${測試名稱}`);
      }
    }
    
    const TestPage = 測試模組.default;
    
    // 執行測試頁面函數
    const jsxContent = await TestPage();
    
    // 轉換為字串
    const htmlContent = String(jsxContent);
    
    // 產生 UnoCSS 樣式
    const css = await 產生樣式(htmlContent);
    
    // 建構完整 HTML
    const 完整HTML = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>測試頁面 - ${測試名稱}</title>
  <style>
    ${css}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
    
    return c.html(完整HTML);
    
  } catch (錯誤) {
    await error('Test Service', `測試頁面載入失敗: ${測試名稱} - ${錯誤}`);
    return await 渲染測試錯誤頁面(c, 錯誤);
  }
}

/**
 * 渲染測試 404 頁面
 */
async function 渲染測試404頁面(c: Context, path: string): Promise<Response> {
  const htmlContent = `
    <div class="container mx-auto p-6 text-center">
      <h1 class="text-4xl font-bold text-primary mb-4">測試頁面不存在</h1>
      <p class="text-lg text-base-content opacity-80 mb-6">
        找不到測試頁面: ${path}
      </p>
      <a href="/test" class="btn-primary">返回測試頁面列表</a>
    </div>
  `;
  
  const css = await 產生樣式(htmlContent);
  
  const 完整HTML = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>測試頁面不存在</title>
  <style>
    ${css}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  
  return c.html(完整HTML, 404);
}

/**
 * 渲染測試錯誤頁面
 */
async function 渲染測試錯誤頁面(c: Context, 錯誤: unknown): Promise<Response> {
  const errorMessage = 錯誤 instanceof Error ? 錯誤.message : String(錯誤);
  const errorString = 錯誤 instanceof Error ? 錯誤.stack || String(錯誤) : String(錯誤);
  
  const htmlContent = `
    <div class="container mx-auto p-6 text-center">
      <h1 class="text-4xl font-bold text-error mb-4">測試頁面錯誤</h1>
      <p class="text-lg text-base-content opacity-80 mb-4">
        ${errorMessage || '發生未知錯誤'}
      </p>
      <pre class="bg-base-200 p-4 rounded text-left text-sm overflow-auto">
        ${errorString}
      </pre>
      <a href="/test" class="btn-primary mt-4">返回測試頁面列表</a>
    </div>
  `;
  
  const css = await 產生樣式(htmlContent);
  
  const 完整HTML = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>測試頁面錯誤</title>
  <style>
    ${css}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  
  return c.html(完整HTML, 500);
}
