// 統一資訊 API
import { Context } from 'hono';
import { info, error } from '../../utils/logger.ts';
import { APIModule, RouteParams } from './index.ts';

// 內部 API 調用輔助函數
async function InnerAPI(c: Context, path: string): Promise<Response> {
  const app = c.get('app');
  return await app.request(path);
}

// 處理取得統一資訊
async function 處理取得統一資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('統一資訊 API', '處理取得統一資訊請求');
    
    // 先嘗試取得網站資訊
    try {
      const 網站資訊回應 = await InnerAPI(c, '/api/v1/websites/info');
      const 網站資訊 = await 網站資訊回應.json();
      
      if (網站資訊.success && 網站資訊.data) {
        await info('統一資訊 API', '成功取得網站資訊');
        return c.json({
          success: true,
          data: 網站資訊.data,
          source: 'website'
        });
      }
    } catch (錯誤) {
      await info('統一資訊 API', `取得網站資訊失敗，回退到系統資訊: ${錯誤}`);
    }
    
    // 如果網站資訊不存在，回退到系統資訊
    try {
      const 系統資訊回應 = await InnerAPI(c, '/api/v1/system/info');
      const 系統資訊 = await 系統資訊回應.json();
      
      if (系統資訊.success && 系統資訊.data) {
        await info('統一資訊 API', '成功取得系統資訊');
        return c.json({
          success: true,
          data: 系統資訊.data,
          source: 'system'
        });
      }
    } catch (錯誤) {
      await error('統一資訊 API', `取得系統資訊失敗: ${錯誤}`);
    }
    
    // 都沒有的話返回錯誤
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: '無法取得任何資訊' }
    }, 404);
    
  } catch (錯誤) {
    await error('統一資訊 API', `取得統一資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得統一資訊時發生錯誤' }
    }, 500);
  }
}

// API 模組匯出
const API: APIModule = {
  GET: 處理取得統一資訊,
  ONE: 處理取得統一資訊
};

export default API;
