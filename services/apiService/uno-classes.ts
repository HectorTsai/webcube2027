// UnoCSS Classes API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 處理取得自訂Classes, 處理取得主題資訊 } from './uno-custom-classes.ts';

// GET - 取得 UnoCSS classes (/api/v1/uno-classes)
export async function GET(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('UnoCSS Classes API', '處理取得 UnoCSS classes 請求');
    
    // 從 query string 取得參數
    const theme = c.req.query('theme');
    const decodedTheme = theme ? decodeURIComponent(theme) : undefined;
    
    // 如果有 theme 參數，取得主題資訊
    if (decodedTheme) {
      // TODO: 將來可以根據 theme 參數返回不同的主題資訊
      return await 處理取得主題資訊(c);
    }
    
    // 無參數，取得所有自訂 classes
    return await 處理取得自訂Classes(c);
    
  } catch (錯誤) {
    await error('UnoCSS Classes API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得 UnoCSS classes 失敗' }
    }, 500);
  }
}

// API 模組匯出
const API: APIModule = {
  GET: GET
};

export default API;
