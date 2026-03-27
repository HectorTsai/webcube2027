// 方塊 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 方塊 from '../../database/models/方塊.ts';

// 內部 API 調用輔助函數
import { InnerAPI } from '../../services/index.ts';

// GET - 取得方塊 (/api/v1/cube/all 或 /api/v1/cube/id 或 /api/v1/cube)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    await info('方塊 API', '處理取得方塊請求');
    
    // 優先檢查路徑參數 (智能回退機制)
    if (params.id === 'all') {
      return await 處理取得所有方塊(c);
    }
    
    // 如果有路徑參數且不是 'all'，當作 ID 處理
    if (params.id) {
      return await 處理取得單一方塊(c, params.id);
    }
    
    // 無參數，取得當前方塊
    return await 處理取得當前方塊(c);
    
  } catch (錯誤) {
    await error('方塊 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得方塊失敗' }
    }, 500);
  }
}

// POST - 創建新方塊 (/api/v1/cube)
export async function POST(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<方塊>(c, '方塊', body);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'CREATE_FAILED', message: '創建方塊失敗' }
      }, 500);
    }
    
    await info('方塊 API', `創建方塊成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    }, 201);
    
  } catch (錯誤) {
    await error('方塊 API', `POST 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '創建方塊失敗' }
    }, 500);
  }
}

// PUT - 更新方塊 (/api/v1/cube?id=xxx)
export async function PUT(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // 從 query string 取得參數
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (!decodedId) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少方塊 ID' }
      }, 400);
    }
    
    // 先檢查方塊是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<方塊>(c, decodedId);
    if (!現有資料.success || !現有資料.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '方塊不存在' }
      }, 404);
    }
    
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<方塊>(c, '方塊', { ...body, id: decodedId });
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新方塊失敗' }
      }, 500);
    }
    
    await info('方塊 API', `更新方塊成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('方塊 API', `PUT 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '更新方塊失敗' }
    }, 500);
  }
}

// DELETE - 刪除方塊 (/api/v1/cube?id=xxx)
export async function DELETE(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // 從 query string 取得參數
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (!decodedId) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少方塊 ID' }
      }, 400);
    }
    
    // 先檢查方塊是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<方塊>(c, decodedId);
    if (!現有資料.success || !現有資料.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '方塊不存在' }
      }, 404);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, decodedId);
    
    if (!結果.success) {
      return c.json({
        success: false,
        error: { code: 'DELETE_FAILED', message: '刪除方塊失敗' }
      }, 500);
    }
    
    await info('方塊 API', `刪除方塊成功: ${decodedId}`);
    
    return c.json({
      success: true,
      message: '方塊已刪除',
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('方塊 API', `DELETE 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '刪除方塊失敗' }
    }, 500);
  }
}

// 處理取得當前方塊
async function 處理取得當前方塊(c: Context): Promise<Response> {
  try {
    await info('方塊 API', '取得當前方塊');
    
    // 從系統資訊取得當前方塊設定
    const 系統資訊回應 = await InnerAPI(c, '/api/v1/info');
    const 系統資訊資料 = await 系統資訊回應.json();
    
    if (!系統資訊資料.success) {
      return c.json({
        success: false,
        error: { code: 'NO_SYSTEM_INFO', message: '無法取得系統資訊' }
      }, 500);
    }
    
    const 當前方塊ID = 系統資訊資料.data?.當前方塊;
    if (!當前方塊ID) {
      return c.json({
        success: false,
        error: { code: 'NO_CURRENT_CUBE', message: '未設定當前方塊' }
      }, 404);
    }
    
    // 取得當前方塊資料
    const 結果 = await 三層查詢管理器.查詢單一<方塊>(c, 當前方塊ID);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '當前方塊不存在' }
      }, 404);
    }
    
    await info('方塊 API', `成功取得當前方塊: ${當前方塊ID}`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('方塊 API', `取得當前方塊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得當前方塊失敗' }
    }, 500);
  }
}

// 處理取得所有方塊
async function 處理取得所有方塊(c: Context): Promise<Response> {
  try {
    await info('方塊 API', '取得所有方塊');
    
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const 結果 = await 三層查詢管理器.查詢列表<方塊>(c, '方塊', limit, offset);
    
    await info('方塊 API', `取得方塊列表: ${結果.data?.length || 0} 筆 (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位 - 精簡列表
    const language = c.get('語言') || 'zh-tw';
    const 過濾資料 = 結果.data ? await 資料過濾器.列表過濾(結果.data, language, 'simple') : [];

    return c.json({
      success: true,
      data: 過濾資料,
      source: 結果.source,
      pagination: {
        limit,
        offset,
        total: 過濾資料.length
      }
    });
    
  } catch (錯誤) {
    await error('方塊 API', `取得方塊列表失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得方塊列表失敗' }
    }, 500);
  }
}

// 處理取得單一方塊
async function 處理取得單一方塊(c: Context, id: string): Promise<Response> {
  try {
    await info('方塊 API', `取得方塊: ${id}`);
    
    const 結果 = await 三層查詢管理器.查詢單一<方塊>(c, id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '方塊不存在' }
      }, 404);
    }
    
    await info('方塊 API', `成功取得方塊: ${id}`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('方塊 API', `取得方塊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得方塊失敗' }
    }, 500);
  }
}

// API 模組匯出
const API: APIModule = {
  GET: GET,
  POST: POST,
  PUT: PUT,
  DELETE: DELETE
};

export default API;
