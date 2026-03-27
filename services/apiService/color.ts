// 配色 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 配色 from '../../database/models/配色.ts';

// 內部 API 調用輔助函數
import { InnerAPI } from '../../services/index.ts';


// GET - 取得配色 (/api/v1/color?id=xxx 或 /api/v1/color?all=true 或 /api/v1/color/all 或 /api/v1/color)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    await info('配色 API', '處理取得配色請求');
    
    // 優先檢查路徑參數 (智能回退機制)
    if (params.id === 'all') {
      return await 處理取得所有配色(c);
    }
    
    // 如果有路徑參數且不是 'all'，當作 ID 處理
    if (params.id) {
      return await 處理取得單一配色(c, params.id);
    }
    
    // 從 query string 取得參數 (向後兼容)
    const id = c.req.query('id');
    const allParam = c.req.query('all');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    // 如果有 all=true，取得所有配色
    if (allParam === 'true') {
      return await 處理取得所有配色(c);
    }
    
    // 如果有 ID，取得單一配色
    if (decodedId) {
      return await 處理取得單一配色(c, decodedId);
    }
    
    // 無參數，取得當前配色
    return await 處理取得當前配色(c);
    
  } catch (錯誤) {
    await error('配色 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得配色失敗' }
    }, 500);
  }
}

// POST - 創建新配色 (/api/v1/colors)
export async function POST(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<配色>(c, '配色', body);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'CREATE_FAILED', message: '創建配色失敗' }
      }, 500);
    }
    
    await info('配色 API', `創建配色成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    }, 201);
    
  } catch (err) {
    await error('配色 API', `POST 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '創建配色失敗' }
    }, 500);
  }
}

// PUT - 更新配色 (/api/v1/color?id=xxx)
export async function PUT(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // 從 query string 取得參數
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (!decodedId) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少配色 ID' }
      }, 400);
    }
    
    await info('配色 API', `更新配色: ${decodedId}`);
    
    // 先檢查配色是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<配色>(c, decodedId);
    if (!現有資料.success || !現有資料.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '配色不存在' }
      }, 404);
    }
    
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<配色>(c, '配色', { ...body, id: decodedId });
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新配色失敗' }
      }, 500);
    }
    
    await info('配色 API', `更新配色成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);
    
    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('配色 API', `PUT 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '更新配色時發生錯誤' }
    }, 500);
  }
}

// DELETE - 刪除配色 (/api/v1/color?id=xxx)
export async function DELETE(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // 從 query string 取得參數
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (!decodedId) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少配色 ID' }
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, decodedId);
    
    if (!結果.success) {
      if (結果.error === 'DELETE_PROTECTED') {
        return c.json({
          success: false,
          error: { code: 'DELETE_PROTECTED', message: '系統預設配色無法刪除' }
        }, 403);
      }
      return c.json({
        success: false,
        error: { code: 'DELETE_FAILED', message: '刪除配色失敗' }
      }, 500);
    }
    
    await info('配色 API', `刪除配色成功: ${decodedId} (來源: ${結果.source})`);
    
    return c.json({
      success: true,
      message: '配色已刪除',
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('配色 API', `DELETE 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '刪除配色時發生錯誤' }
    }, 500);
  }
}

// 處理取得當前配色（層級邏輯：系統資訊 -> 佈景主題 -> 預設）
async function 處理取得當前配色(c: Context): Promise<Response> {
  try {
    await info('配色 API', '開始取得當前配色');
    
    // 1. 取得統一資訊
    const 資訊回應 = await InnerAPI(c, '/api/v1/info');
    const 資訊 = await 資訊回應.json();
    
    if (!資訊.success || !資訊.data) {
      await info('配色 API', '無法取得資訊，回傳預設配色');
      return await 處理取得預設配色(c);
    }
    
    const 資訊資料 = 資訊.data;
    
    // 2. 如果有資訊中的配色 ID，直接取得配色
    if (資訊資料.配色) {
      await info('配色 API', `從資訊直接取得配色: ${資訊資料.配色}`);
      
      // 直接使用三層查詢管理器，避免循環調用
      const 結果 = await 三層查詢管理器.查詢單一<配色>(c, 資訊資料.配色);
      
      if (結果.success && 結果.data) {
        return c.json({
          success: true,
          data: 結果.data,
          source: 結果.source
        });
      }
    }
    
    // 3. 如果沒有直接配色，從佈景主題取得
    if (資訊資料.佈景主題) {
      await info('配色 API', `從佈景主題取得配色: ${資訊資料.佈景主題}`);
      
      const 主題回應 = await InnerAPI(c, `/api/v1/theme?id=${資訊資料.佈景主題}`);
      const 主題結果 = await 主題回應.json();
      
      if (主題結果.success && 主題結果.data.配色) {
        // 直接使用三層查詢管理器，避免循環調用
        const 結果 = await 三層查詢管理器.查詢單一<配色>(c, 主題結果.data.配色);
        
        if (結果.success && 結果.data) {
          return c.json({
            success: true,
            data: 結果.data,
            source: 結果.source,
            themeId: 資訊資料.佈景主題
          });
        }
      }
    }
    
    // 4. 如果都沒有，回傳預設配色
    await info('配色 API', '無法從資訊或主題取得配色，回傳預設配色');
    return await 處理取得預設配色(c);
    
  } catch (錯誤) {
    await error('配色 API', `取得當前配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得當前配色失敗' }
    }, 500);
  }
}

// 處理取得所有配色
async function 處理取得所有配色(c: Context): Promise<Response> {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const 結果 = await 三層查詢管理器.查詢列表<配色>(c, '配色', limit, offset);
    
    await info('配色 API', `取得配色列表: ${結果.data?.length || 0} 筆 (來源: ${結果.source})`);
    
    // 使用資料過濾器處理列表
    const language = c.get('語言') || 'zh-tw';
    const 簡化資料 = 結果.data ? await 資料過濾器.列表過濾(結果.data, language, 'simple') : [];

    return c.json({
      success: 結果.success,
      data: 簡化資料,
      source: 結果.source,
      pagination: {
        limit,
        offset,
        total: 結果.data?.length || 0
      }
    });
    
  } catch (錯誤) {
    await error('配色 API', `取得配色列表失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得配色列表失敗' }
    }, 500);
  }
}

// 處理取得單一配色
async function 處理取得單一配色(c: Context, id: string): Promise<Response> {
  try {
    await info('配色 API', `取得配色: ${id}`);
    
    const 結果 = await 三層查詢管理器.查詢單一<配色>(c, id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '配色不存在' }
      }, 404);
    }
    
    await info('配色 API', `取得配色: ${id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('配色 API', `取得配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得配色失敗' }
    }, 500);
  }
}

// 處理取得預設配色
async function 處理取得預設配色(c: Context): Promise<Response> {
  try {
    const 結果 = await 三層查詢管理器.取得預設值<配色>(c, '配色');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設配色' }
      }, 500);
    }
    
    await info('預設值 API', `取得預設配色: ${結果.data.id} (來源: ${結果.source})`);
    
    // 過濾並格式化回應資料
    const 回應資料 = {
      id: 結果.data.id,
      名稱: 結果.data.名稱 ? await 結果.data.名稱.toStringAsync('zh-tw') : null,
      描述: 結果.data.描述 ? await 結果.data.描述.toStringAsync('zh-tw') : null,
      主色: 結果.data.主色,
      次色: 結果.data.次色,
      強調色: 結果.data.強調色,
      中性色: 結果.data.中性色,
      背景1: 結果.data.背景1,
      背景2: 結果.data.背景2,
      背景3: 結果.data.背景3,
      背景內容: 結果.data.背景內容,
      資訊色: 結果.data.資訊色,
      成功色: 結果.data.成功色,
      警告色: 結果.data.警告色,
      錯誤色: 結果.data.錯誤色,
      售價: 結果.data.售價,
      標籤集: 結果.data.標籤集,
      最後修改: 結果.data.最後修改,
      可刪除: 結果.data.可刪除,
      isDefault: true,
      isSystemSeed: 結果.source === 'L1'
    };

    return c.json({
      success: true,
      data: 回應資料,
      source: 'L0' // 預設值統一標記為 L0
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設配色失敗' }
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
