// Renderer Service 主要入口點 - 對接 pageService 動態渲染管線

import { Context } from 'hono';
import { 產生樣式 } from '../../unocss/unocss.ts';
import { info, error } from '../../utils/logger.ts';
import { InnerAPI } from '../index.ts';
import PageService from '../pageService/index.ts';
import 骨架 from "../../database/models/骨架.ts";
import 配色 from "../../database/models/配色.ts";
import 風格 from "../../database/models/風格.ts";
import 裝飾 from "../../database/models/裝飾.ts";

export async function 處理Renderer請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;
  
  try {
    if (method !== 'GET') {
      return c.json({ success: false, message: 'Renderer Service 只支援 GET 請求' }, 405);
    }
    return await 渲染頁面(c, path);
  } catch (錯誤: any) {
    return c.json({ success: false, message: '頁面渲染失敗', error: 錯誤.message }, 500);
  }
}

async function 渲染頁面(c: Context, path: string): Promise<Response> {
  try {
    await info('Renderer Service', `開始渲染流程，請求路徑: ${path}`);
    
    // 1. 解析語言與頁面路徑
    const 解析結果 = await PageService.解析URL路徑(path, c);
    if (!解析結果) {
      await info('Renderer Service', `語言不支援，回傳 404`);
      return c.html('<h1>404 - 語言不支援</h1>', 404);
    }
    
    // 2. 設定語言到 Context
    c.set('語言', 解析結果.語言);
    
    // 3. 依路徑查找頁面
    const 頁面實例 = await PageService.findPageByPath(解析結果.頁面路徑, c);
    if (!頁面實例) {
      await info('Renderer Service', `頁面不存在: ${解析結果.頁面路徑}，回傳 404`);
      return c.html('<h1>404 - 頁面不存在</h1>', 404);
    }
    
    // 4. 解析路由參數
    const 路由參數 = PageService.parseRouteParams(解析結果.頁面路徑, 頁面實例.路徑);
    
    // 5. 調用 pageService 渲染頁面內容（含佈局包裹）
    const htmlContent = await PageService.renderPage(頁面實例, 路由參數, c);
    
    // 6. 取得主題設定（用於 CSS 變數注入）
    const [當前配色, 當前骨架, 當前風格, 當前裝飾, 當前動畫] = await 取得完整主題設定(c);
    
    // 7. 生成完整 HTML 文件
    const 完整HTML = await 生成完整HTML(c, 頁面實例, htmlContent, 當前配色, 當前骨架, 當前風格, 當前裝飾, 當前動畫);
    
    return c.html(完整HTML);
    
  } catch (錯誤: any) {
    await error('Renderer Service', `渲染失敗: ${錯誤.message}`);
    return c.html(`<h1 style="color:red">渲染異常: ${錯誤.message}</h1>`, 500);
  }
}

async function 取得完整主題設定(c: Context): Promise<[配色, 骨架, 風格, 裝飾, any]> {
  let 最終配色 = new 配色(); let 最終骨架 = new 骨架(); let 最終風格 = new 風格(); let 最終裝飾 = new 裝飾(); let 最終動畫 = null;
  try {
    const 主題回應 = await InnerAPI(c, '/api/v1/theme');
    if (主題回應.ok) {
      const 主題資料 = await 主題回應.json();
      if (主題資料.success && 主題資料.data) {
        const theme = 主題資料.data;
        if (theme.配色) {
          const res = await (await InnerAPI(c, `/api/v1/color?id=${encodeURIComponent(theme.配色)}`)).json();
          if (res.success) 最終配色 = new 配色(res.data);
        }
        if (theme.骨架) {
          const res = await (await InnerAPI(c, `/api/v1/skeleton?id=${encodeURIComponent(theme.骨架)}`)).json();
          if (res.success) 最終骨架 = new 骨架(res.data);
        }
        if (theme.風格) {
          const res = await (await InnerAPI(c, `/api/v1/style?id=${encodeURIComponent(theme.風格)}`)).json();
          if (res.success) 最終風格 = new 風格(res.data);
        }
        if (theme.裝飾) {
          const res = await (await InnerAPI(c, `/api/v1/ornament?id=${encodeURIComponent(theme.裝飾)}`)).json();
          if (res.success) 最終裝飾 = new 裝飾(res.data);
        }
        if (theme.動畫) {
          const res = await (await InnerAPI(c, `/api/v1/animate?id=${encodeURIComponent(theme.動畫)}`)).json();
          if (res.success) 最終動畫 = res.data;
        }
      }
    }
  } catch (e) {}
  return [最終配色, 最終骨架, 最終風格, 最終裝飾, 最終動畫];
}

function 骨架實例解析(骨架實例: 骨架, key: string): string {
  return 骨架實例?.配置?.[key] || '';
}

/**
 * 生成 HTML 結構：將色彩天王數值正式轉化為全域變數，為大一統架構送電！
 */
async function 生成完整HTML(
  c: Context, 
  頁面: any, 
  內容: string, 
  配色實例: 配色, 
  骨架實例: 骨架,
  風格實例: 風格,
  裝飾實例: 裝飾,
  動畫資料: any
): Promise<string> {
  const lang = c.get('語言') || 'zh-tw';
  
  // 提取頁面標題（MultilingualString → 指定語言）
  let pageTitle = 'WebCube 2027';
  try {
    if (頁面?.標題) {
      const titleObj = typeof 頁面.標題.toJSON === 'function' ? 頁面.標題.toJSON() : 頁面.標題;
      pageTitle = titleObj?.[lang] || titleObj?.['zh-tw'] || titleObj?.en || 'WebCube 2027';
    }
  } catch { /* 保底使用預設標題 */ }
  
  // 1. 執行 UnoCSS 產生樣式（回傳 string，參數順序：html, 配色, 快取, 骨架, 風格, 裝飾）
  const css = await 產生樣式(內容, 配色實例, true, 骨架實例, 風格實例, 裝飾實例);

  // 2. 提取真實的色彩數據 (保底走經典藍數值)
  const 主色 = 配色實例?.主色 || "59.67% 0.221 258.03";
  const 背景色 = 配色實例?.背景色 || "100% 0 0";
  const 資訊色 = 配色實例?.資訊色 || "71.17% 0.166 241.15";
  const 成功色 = 配色實例?.成功色 || "60.9% 0.135 161.2";
  const 警告色 = 配色實例?.警告色 || "73% 0.19 52";
  const 錯誤色 = 配色實例?.錯誤色 || "53% 0.21 24";

  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${pageTitle}</title>
      <script defer src="/media/v1/script/alpine.min.js"></script>
      <script defer src="/media/v1/script/page-flip.browser.min.js"></script>
      <script defer src="/media/v1/script/embla-carousel.min.js"></script>
      <script type="module" src="/media/v1/script/cally.js"></script>
      <style>
        /* 🎯 關鍵救星：定義全域變數，讓您的 c-style-apply 順利吸到源頭活水 */
        :root {
          --color-primary-raw: ${主色};
          --color-primary-content-raw: ${背景色}; /* 通常內容色會跟背景或中性對齊 */
          --color-primary-90-raw: ${主色} / 0.9;
          --color-primary-70-raw: ${主色} / 0.7;
          --color-primary-50-raw: ${主色} / 0.5;
          --color-primary-30-raw: ${主色} / 0.3;
          --color-primary-10-raw: ${主色} / 0.1;
          
          /* 骨架物理變數注入 */
          --radius-md: ${骨架實例?.配置?.['radius-md'] || '0.5rem'};
          --font-base: ${骨架實例?.配置?.['font-base'] || '1rem'};
        }

        /* 注入 UnoCSS 產生的門禁樣式 */
        ${css}        
      </style>
    </head>
    <body x-data x-init="Alpine.store('Container', {})" style="margin: 0;">
        ${內容}
    </body>
    </html>
  `;
}