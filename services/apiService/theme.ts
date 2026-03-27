// 佈景主題 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 佈景主題 from '../../database/models/佈景主題.ts';

// 內部 API 調用輔助函數
import { InnerAPI } from '../../services/index.ts';

// GET - 取得佈景主題 (/api/v1/theme?id=xxx 或 /api/v1/theme?all=true 或 /api/v1/theme)
export async function GET(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('佈景主題 API', '處理取得佈景主題請求');
    
    // 從 query string 取得參數
    const id = c.req.query('id');
    const allParam = c.req.query('all');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    // 如果有 all=true，取得所有佈景主題
    if (allParam === 'true') {
      return await 處理取得所有佈景主題(c);
    }
    
    // 如果有 ID，取得單一佈景主題
    if (decodedId) {
      return await 處理取得單一佈景主題(c, decodedId);
    }
    
    // 無參數，取得當前佈景主題
    return await 處理取得當前佈景主題(c);
    
  } catch (錯誤) {
    await error('佈景主題 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得佈景主題失敗' }
    }, 500);
  }
}


// POST - 創建新佈景主題 (/api/v1/themes)
export async function POST(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<佈景主題>(c, '佈景主題', body);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'CREATE_FAILED', message: '創建佈景主題失敗' }
      }, 500);
    }
    
    await info('佈景主題 API', `創建佈景主題成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    }, 201);
    
  } catch (err) {
    await error('佈景主題 API', `POST 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '創建佈景主題失敗' }
    }, 500);
  }
}

// PUT - 更新佈景主題 (/api/v1/theme?id=xxx)
export async function PUT(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // 從 query string 取得參數
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (!decodedId) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少佈景主題 ID' }
      }, 400);
    }
    
    // 先檢查佈景主題是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<佈景主題>(c, decodedId);
    if (!現有資料.success || !現有資料.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '佈景主題不存在' }
      }, 404);
    }
    
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<佈景主題>(c, '佈景主題', { ...body, id: decodedId });
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新佈景主題失敗' }
      }, 500);
    }
    
    await info('佈景主題 API', `更新佈景主題成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (err) {
    await error('佈景主題 API', `PUT 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '更新佈景主題失敗' }
    }, 500);
  }
}

// DELETE - 刪除佈景主題 (/api/v1/themes/:id)
export async function DELETE(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (!params.id) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少佈景主題 ID' }
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, params.id);
    
    if (!結果.success) {
      if (結果.error === 'DELETE_PROTECTED') {
        return c.json({
          success: false,
          error: { code: 'DELETE_PROTECTED', message: '此佈景主題受保護，無法刪除' }
        }, 403);
      }
      return c.json({
        success: false,
        error: { code: 'DELETE_FAILED', message: '刪除佈景主題失敗' }
      }, 500);
    }
    
    await info('佈景主題 API', `刪除佈景主題成功: ${params.id} (來源: ${結果.source})`);
    
    return c.json({
      success: true,
      message: '佈景主題已刪除',
      source: 結果.source
    });
    
  } catch (err) {
    await error('佈景主題 API', `DELETE 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '刪除佈景主題失敗' }
    }, 500);
  }
}

// 處理取得當前佈景主題（層級邏輯：統一資訊 -> 預設）
async function 處理取得當前佈景主題(c: Context): Promise<Response> {
  try {
    await info('佈景主題 API', '開始取得當前佈景主題');
    
    // 1. 取得統一資訊
    const 資訊回應 = await InnerAPI(c, '/api/v1/info');
    const 資訊 = await 資訊回應.json();
    
    if (!資訊.success || !資訊.data) {
      await info('佈景主題 API', '無法取得資訊，回傳預設佈景主題');
      return await 處理取得預設佈景主題(c);
    }
    
    const 資訊資料 = 資訊.data;
    
    // 2. 如果有資訊中的佈景主題 ID，直接取得佈景主題
    if (資訊資料.佈景主題) {
      await info('佈景主題 API', `從資訊直接取得佈景主題: ${資訊資料.佈景主題}`);
      
      const 主題回應 = await InnerAPI(c, `/api/v1/theme?id=${資訊資料.佈景主題}`);
      const 主題結果 = await 主題回應.json();
      
      if (主題結果.success) {
        return c.json({
          success: true,
          data: 主題結果.data,
          source: 'info'
        });
      }
    }
    
    // 3. 如果都沒有，回傳預設佈景主題
    await info('佈景主題 API', '無法從資訊取得佈景主題，回傳預設佈景主題');
    return await 處理取得預設佈景主題(c);
    
  } catch (錯誤) {
    await error('佈景主題 API', `取得當前佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得當前佈景主題失敗' }
    }, 500);
  }
}

// 處理取得所有佈景主題
async function 處理取得所有佈景主題(c: Context): Promise<Response> {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    const includeSeed = c.req.query('include_seeds') !== 'false';
    
    const 結果 = await 三層查詢管理器.查詢列表<佈景主題>(c, '佈景主題', limit, offset);
    
    let 過濾資料 = 結果.data || [];
    
    // 如果不包含系統種子，過濾掉來源為 L1 的資料
    if (!includeSeed) {
      過濾資料 = 過濾資料.filter(item => {
        const jsonData = item.toJSON() as Record<string, unknown>;
        return !jsonData.isSystemSeed;
      });
    }
    
    await info('佈景主題 API', `取得佈景主題列表: ${過濾資料.length} 筆 (來源: ${結果.source})`);
    
    // 複數 API (themes) 只回傳簡化資料：id, 名稱, 描述
    const language = c.get('語言') || 'zh-tw';
    const 簡化資料 = await 資料過濾器.列表過濾(過濾資料, language, 'simple');

    return c.json({
      success: 結果.success,
      data: 簡化資料,
      source: 結果.source,
      pagination: {
        limit,
        offset,
        total: 過濾資料.length
      }
    });
    
  } catch (錯誤) {
    await error('佈景主題 API', `取得佈景主題列表失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得佈景主題列表失敗' }
    }, 500);
  }
}

// 處理取得單一佈景主題
async function 處理取得單一佈景主題(c: Context, id: string): Promise<Response> {
  try {
    await info('佈景主題 API', `取得佈景主題: ${id}`);
    
    const 結果 = await 三層查詢管理器.查詢單一<佈景主題>(c, id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '佈景主題不存在' }
      }, 404);
    }
    
    await info('佈景主題 API', `取得佈景主題: ${id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('佈景主題 API', `取得佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得佈景主題失敗' }
    }, 500);
  }
}

// 處理取得預設佈景主題
async function 處理取得預設佈景主題(c: Context): Promise<Response> {
  try {
    const 結果 = await 三層查詢管理器.取得預設值<佈景主題>(c, '佈景主題');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設佈景主題' }
      }, 500);
    }
    
    await info('預設值 API', `取得預設佈景主題: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);
    
    // 添加預設值標記
    (回應資料 as any).isDefault = true;
    (回應資料 as any).isSystemSeed = 結果.source === 'L1';

    return c.json({
      success: true,
      data: 回應資料,
      source: 'L0' // 預設值統一標記為 L0
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設佈景主題失敗' }
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
