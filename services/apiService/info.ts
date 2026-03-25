// 統一資訊 API 模組 - 處理 /api/v1/info 路由
import { Context } from 'hono';
import { RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';

// 處理取得統一資訊
async function 處理取得統一資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('統一資訊 API', '處理取得統一資訊請求');
    
    const language = c.get('語言') || 'zh-tw';
    
    // 1. 先嘗試從 context 取得網站資訊
    const 網站資訊 = c.get('網站資訊');
    if (網站資訊) {
      await info('統一資訊 API', '從 context 取得網站資訊');
      // 使用資料過濾器處理多國語言字串
      const 過濾後資料 = await 資料過濾器.一般過濾(網站資訊, language);
      return c.json({
        success: true,
        data: 過濾後資料,
        source: 'website'
      });
    }
    
    // 2. 如果網站資訊不存在，從 context 取得系統資訊
    const 系統資訊 = c.get('系統資訊');
    if (系統資訊) {
      await info('統一資訊 API', '從 context 取得系統資訊');
      // 使用資料過濾器處理多國語言字串
      const 過濾後資料 = await 資料過濾器.一般過濾(系統資訊, language);
      return c.json({
        success: true,
        data: 過濾後資料,
        source: 'system'
      });
    }
    
    // 3. 都沒有的話返回錯誤
    await error('統一資訊 API', 'context 中沒有任何資訊');
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

// GET - 取得統一資訊
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  return await 處理取得統一資訊(c, params);
}

// ONE - 取得統一資訊（與 GET 相同）
export async function ONE(c: Context, params: RouteParams): Promise<Response> {
  return await 處理取得統一資訊(c, params);
}
