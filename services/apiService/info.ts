// 統一資訊 API 模組 - 處理 /api/v1/info/* 路由
import { Context } from 'hono';
import { RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import 網站資訊 from '../../database/models/網站資訊.ts';

// 處理取得系統資訊
async function 處理取得系統資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    
    // 從 context 取得預先載入的系統資訊
    const 系統資訊 = c.get('系統資訊');
    
    if (!系統資訊) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '系統資訊不存在' }
      }, 404);
    }
    
    const language = c.get('語言') || 'zh-tw';
    const 過濾後資料 = await 資料過濾器.一般過濾(系統資訊, language);
    
    return c.json({
      success: true,
      data: 過濾後資料,
      source: 'system'
    });
    
  } catch (錯誤) {
    await error('統一資訊 API', `取得系統資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得系統資訊失敗' }
    }, 500);
  }
}

// 處理取得網站資訊
async function 處理取得網站資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    
    // 1. 先嘗試從 context 取得網站資訊
    const 網站資訊 = c.get('網站資訊');
    if (網站資訊) {
      const language = c.get('語言') || 'zh-tw';
      const 過濾後資料 = await 資料過濾器.一般過濾(網站資訊, language);
      return c.json({
        success: true,
        data: 過濾後資料,
        source: 'website'
      });
    }
    
    // 2. 如果 context 中沒有，從資料庫查詢
    const 結果 = await 三層查詢管理器.取得預設值<網站資訊>(c, '網站資訊');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '網站資訊不存在' }
      }, 404);
    }
    
    const language = c.get('語言') || 'zh-tw';
    const 過濾後資料 = await 資料過濾器.一般過濾(結果.data, language);
    
    return c.json({
      success: true,
      data: 過濾後資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('統一資訊 API', `取得網站資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得網站資訊失敗' }
    }, 500);
  }
}

// 處理取得統一資訊 (預設：優先網站資訊，回退系統資訊)
async function 處理取得統一資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // await info('統一資訊 API', '處理取得統一資訊請求');
    
    const language = c.get('語言') || 'zh-tw';
    
    // 1. 先嘗試從 context 取得網站資訊
    const 網站資訊 = c.get('網站資訊');
    if (網站資訊) {
      // await info('統一資訊 API', '從 context 取得網站資訊');
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
      // await info('統一資訊 API', '從 context 取得系統資訊');
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

// GET - 取得資訊 (/api/v1/info/system 或 /api/v1/info/website 或 /api/v1/info)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // await info('統一資訊 API', '處理取得資訊請求');
    
    // 優先檢查路徑參數 (智能回退機制)
    if (params.id === 'system') {
      return await 處理取得系統資訊(c, params);
    }
    
    if (params.id === 'website') {
      return await 處理取得網站資訊(c, params);
    }
    
    // 無參數，預設行為：優先網站資訊，回退系統資訊
    return await 處理取得統一資訊(c, params);
    
  } catch (錯誤) {
    await error('統一資訊 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得資訊失敗' }
    }, 500);
  }
}

// API 模組匯出
import { APIModule } from './index.ts';

const API: APIModule = {
  GET: GET
};

export default API;
