// Renderer Service 主要入口點
import { Context } from 'hono';
import { 產生樣式 } from '../../core/unocss.ts';
import { info, error } from '../../utils/logger.ts';
import PageService from '../pageService/index.ts';
import { InnerAPI } from '../index.ts';

// Renderer Service 處理器
export async function 處理Renderer請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    await info('Renderer Service', `處理 ${method} ${path}`);
    
    // 只處理 GET 請求
    if (method !== 'GET') {
      return c.json({
        success: false,
        message: 'Renderer Service 只支援 GET 請求',
        error: 'METHOD_NOT_ALLOWED'
      }, 405);
    }
    
    // 使用新的頁面系統
    await info('Renderer Service', `開始渲染頁面: ${path}`);
    return await 渲染頁面(c, path);
    
  } catch (錯誤) {
    await error('Renderer Service', `渲染失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '頁面渲染失敗',
      error: 錯誤.message
    }, 500);
  }
}

// 渲染頁面
async function 渲染頁面(c: Context, path: string): Promise<Response> {
  try {
    // 1. 查找頁面（傳遞 Context 進行語言解析）
    const 頁面實例 = await PageService.findPageByPath(path, c);
    
    if (!頁面實例) {
      // 頁面不存在，返回 404
      return await 渲染404頁面(c, path);
    }
    
    // 2. 取得語言解析器設定的語言
    const 當前語言 = c.get('語言') || 'zh-tw';
    
    // 解析動態路由參數
    const 路由參數 = 頁面實例.路徑模式 
      ? PageService.parseRouteParams(path, 頁面實例.路徑模式)
      : {};
    
    // 4. 渲染頁面內容，傳遞 Context
    const 頁面內容 = await PageService.renderPage(頁面實例, 路由參數, c);
    
    // 5. 生成完整 HTML
    const 完整HTML = await 生成完整HTML(c, 頁面實例, 頁面內容);
    
    return c.html(完整HTML);
    
  } catch (錯誤) {
    await error('Renderer Service', `頁面渲染失敗: ${錯誤}`);
    return await 渲染錯誤頁面(c, 錯誤);
  }
}

// 生成完整 HTML
async function 生成完整HTML(c: Context, 頁面實例: any, 頁面內容: string): Promise<string> {
  // 1. 取得主題資訊
  const [預設配色回應, 預設骨架回應] = await Promise.all([
    InnerAPI(c, '/api/v1/defaults/color'),
    InnerAPI(c, '/api/v1/skeleton')
  ]);
  
  const 預設配色 = await (await 預設配色回應).json();
  const 預設骨架 = await (await 預設骨架回應).json();
  
  // 2. 生成 CSS
  const css = await 產生樣式('', 預設配色.資料, true);
  
  // 3. 取得頁面標題
  const 語言 = c.get('語言') || 'zh-tw';
  const 標題 = 頁面實例.標題?.[語言] || 頁面實例.標題?.en || 'WebCube 2027';
  
  // 4. 建構完整 HTML
  return `
<!DOCTYPE html>
<html lang="${語言}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${標題}</title>
  <style>${css}</style>
</head>
<body>
  <div class="min-h-screen bg-base-100 text-base-content">
    ${頁面內容}
  </div>
</body>
</html>`;
}

// 渲染 404 頁面
async function 渲染404頁面(c: Context, path: string): Promise<Response> {
  const htmlContent = `
    <div class="container mx-auto p-6 text-center">
      <h1 class="text-4xl font-bold text-primary mb-4">404 - 頁面不存在</h1>
      <p class="text-lg text-base-content opacity-80 mb-6">
        找不到路徑: ${path}
      </p>
      <a href="/" class="btn-primary">返回首頁</a>
    </div>
  `;
  
  const 完整HTML = await 生成完整HTML(c, { 標題: { en: 'Page Not Found', 'zh-tw': '頁面不存在' } }, htmlContent);
  return c.html(完整HTML, 404);
}

// 渲染錯誤頁面
async function 渲染錯誤頁面(c: Context, 錯誤: any): Promise<Response> {
  const htmlContent = `
    <div class="container mx-auto p-6 text-center">
      <h1 class="text-4xl font-bold text-error mb-4">渲染錯誤</h1>
      <p class="text-lg text-base-content opacity-80 mb-4">
        ${錯誤.message || '發生未知錯誤'}
      </p>
      <a href="/" class="btn-primary">返回首頁</a>
    </div>
  `;
  
  const 完整HTML = await 生成完整HTML(c, { 標題: { en: 'Error', 'zh-tw': '錯誤' } }, htmlContent);
  return c.html(完整HTML, 500);
}
