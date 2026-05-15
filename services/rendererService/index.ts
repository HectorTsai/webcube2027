// Renderer Service 主要入口點

import { Context } from 'hono';
import { 產生樣式 } from '../../core/unocss.ts';
import { info, error } from '../../utils/logger.ts';
import PageService from '../pageService/index.ts';
import { InnerAPI } from '../index.ts';
import 骨架 from "../../database/models/骨架.ts";
import 配色 from "../../database/models/配色.ts";

/**
 * Renderer Service 處理器
 */
export async function 處理Renderer請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    if (method !== 'GET') {
      return c.json({
        success: false,
        message: 'Renderer Service 只支援 GET 請求',
        error: 'METHOD_NOT_ALLOWED'
      }, 405);
    }
    
    return await 渲染頁面(c, path);
    
  } catch (錯誤: any) {
    await error('Renderer Service', `渲染失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '頁面渲染失敗',
      error: 錯誤.message
    }, 500);
  }
}

/**
 * 渲染頁面主邏輯
 */
async function 渲染頁面(c: Context, path: string): Promise<Response> {
  try {
    // 1. 查找頁面（傳遞 Context 進行語言解析）
    const 頁面實例 = await PageService.findPageByPath(path, c);

    if (!頁面實例) {
      return await 渲染404頁面(c, path);
    }
    
    // 2. 解析動態路由參數
    const 路由參數 = 頁面實例.路徑模式 
      ? PageService.parseRouteParams(path, 頁面實例.路徑模式)
      : {};
    
    // 3. 提前取得骨架與配色，存入 Context 共享，避免重複查詢
    const [預設配色, 預設骨架] = await 取得主題設定(c);
    
    // 4. 渲染頁面內容
    const 頁面內容 = await PageService.renderPage(頁面實例, 路由參數, c);
    
    // 5. 生成完整 HTML
    const 完整HTML = await 生成完整HTML(c, 頁面實例, 頁面內容, 預設配色, 預設骨架);
    
    return c.html(完整HTML);
    
  } catch (錯誤) {
    await error('Renderer Service', `頁面渲染失敗: ${錯誤}`);
    return await 渲染錯誤頁面(c, 錯誤);
  }
}

/**
 * 生成完整 HTML 骨架
 * 優化：加入 x-cloak 樣式防止 Alpine.js 前端元件閃爍，並加固標題安全抽取
 */
async function 生成完整HTML(c: Context, 頁面實例: any, 頁面內容: string, 預設配色: any, 預設骨架: any): Promise<string> {
  // 1. 建立預覽 HTML 用於 UnoCSS 掃描
  const 預覽HTML = `
    <div class="min-h-screen bg-base-100 text-base-content">
      ${頁面內容}
    </div>
  `;
  
  // 2. 生成 CSS
  const css = await 產生樣式(預覽HTML, 預設配色, true, 預設骨架);
  
  // 3. 安全取得頁面標題 (相容 Model 實例、MultilingualString 與 404/Error 的原生安全物件)
  const 語言 = c.get('語言') || 'zh-tw';
  let 標題 = 'WebCube 2027';
  
  if (頁面實例 && 頁面實例.標題) {
    if (typeof 頁面實例.標題.toStringAsync === 'function') {
      // 如果標題本身是未解構的多語言實例，嘗試安全提取
      標題 = 頁面實例.標題[語言] || 頁面實例.標題['zh-tw'] || 頁面實例.標題.en || 標題;
    } else if (typeof 頁面實例.標題 === 'object') {
      標題 = 頁面實例.標題[語言] || 頁面實例.標題['zh-tw'] || 頁面實例.標題.en || 標題;
    } else if (typeof 頁面實例.標題 === 'string') {
      標題 = 頁面實例.標題;
    }
  }
  
  // 4. 建構完整 HTML (置入 [x-cloak] 樣式與屬性)
  return `<!DOCTYPE html>
<html lang="${語言}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${標題}</title>
  <style>
    /* 防止 Alpine.js 尚未載入完成前，隱藏元件閃現 */
    [x-cloak] { display: none !important; }
    ${css}
  </style>
  <script defer src="/media/v1/script/alpine.min.js"></script>
  <script defer src="/media/v1/script/page-flip.browser.min.js"></script>
  <script defer src="/media/v1/script/embla-carousel.min.js"></script>
  <script type="module" src="/media/v1/script/cally.js"></script>
</head>
<body x-data x-cloak>
  <div class="min-h-screen bg-base-100 text-base-content">
    ${頁面內容}
  </div>
</body>
</html>`;
}

/**
 * 渲染 404 頁面
 */
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
  
  const [預設配色, 預設骨架] = await 取得主題設定(c);
  const 完整HTML = await 生成完整HTML(c, { 標題: { en: 'Page Not Found', 'zh-tw': '頁面不存在' } }, htmlContent, 預設配色, 預設骨架);
  return c.html(完整HTML, 404);
}

/**
 * 渲染 500 錯誤頁面
 */
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
  
  const [預設配色, 預設骨架] = await 取得主題設定(c);
  const 完整HTML = await 生成完整HTML(c, { 標題: { en: 'Error', 'zh-tw': '錯誤' } }, htmlContent, 預設配色, 預設骨架);
  return c.html(完整HTML, 500);
}

/**
 * 取得主題設定 (配色與骨架)，善用 Context 緩存
 */
async function 取得主題設定(c: Context): Promise<[配色, 骨架]> {
  let 預設配色: 配色 = c.get('color');
  let 預設骨架: 骨架 = c.get('skeleton');
  
  if (!預設配色 || !預設骨架) {
    const [配色回應, 骨架回應] = await Promise.all([
      InnerAPI(c, '/api/v1/defaults/color'),
      InnerAPI(c, '/api/v1/skeleton')
    ]);
    預設配色 = new 配色((await 配色回應.json()).資料);
    預設骨架 = new 骨架((await 骨架回應.json()).資料);
    c.set('color', 預設配色);
    c.set('skeleton', 預設骨架);
  }
  return [預設配色, 預設骨架];
}