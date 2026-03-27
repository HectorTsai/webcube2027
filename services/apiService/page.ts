// 頁面 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 頁面 from '../../database/models/頁面.ts';

// GET - 取得頁面 (/api/v1/page?id=xxx 或 /api/v1/page?route=/en/home)
export async function GET(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('頁面 API', '處理取得頁面請求');
    
    // 從 query string 取得參數
    const id = c.req.query('id');
    const route = c.req.query('route');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    const decodedRoute = route ? decodeURIComponent(route) : undefined;
    
    // 如果有 route，根據路徑取得頁面
    if (decodedRoute) {
      return await 處理根據路徑取得頁面(c, decodedRoute);
    }
    
    // 如果有 ID，取得單一頁面
    if (decodedId) {
      return await 處理取得單一頁面(c, decodedId);
    }
    
    // 無參數，回傳錯誤（頁面 API 需要指定 id 或 route）
    return c.json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: '請提供 id 或 route 參數' }
    }, 400);
    
  } catch (錯誤) {
    await error('頁面 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得頁面失敗' }
    }, 500);
  }
}

// POST - 創建新頁面 (/api/v1/page)
export async function POST(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const body = await c.req.json();
    await info('頁面 API', '建立新頁面');
    
    const 結果 = await 三層查詢管理器.創建或更新<頁面>(c, '頁面', {
      ...body,
      標題: body.標題 || { 'zh-tw': '新頁面' },
      方塊: body.方塊 || '方塊:方塊:容器',
      內容: body.內容 || {
        direction: 'column',
        gap: 'lg',
        padding: 'lg',
        children: []
      },
      元數據: body.元數據 || {
        描述: { 'zh-tw': '新頁面' },
        關鍵字: { 'zh-tw': '新頁面' }
      },
      狀態: 'DRAFT',
      售價: 0
    });
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'CREATE_FAILED', message: '建立頁面失敗' }
      }, 500);
    }
    
    await info('頁面 API', `建立頁面成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    }, 201);
    
  } catch (錯誤) {
    await error('頁面 API', `POST 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '建立頁面失敗' }
    }, 500);
  }
}

// PUT - 更新頁面 (/api/v1/page?id=xxx)
export async function PUT(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // 從 query string 取得參數
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (!decodedId) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少頁面 ID' }
      }, 400);
    }
    
    const body = await c.req.json();
    await info('頁面 API', `更新頁面: ${decodedId}`);
    
    // 先檢查頁面是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<頁面>(c, decodedId);
    if (!現有資料.success || !現有資料.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '頁面不存在' }
      }, 404);
    }
    
    const 結果 = await 三層查詢管理器.創建或更新<頁面>(c, '頁面', { ...body, id: decodedId });
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新頁面失敗' }
      }, 500);
    }
    
    await info('頁面 API', `更新頁面成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('頁面 API', `PUT 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '更新頁面失敗' }
    }, 500);
  }
}

// DELETE - 刪除頁面 (/api/v1/page?id=xxx)
export async function DELETE(c: Context, _params: RouteParams): Promise<Response> {
  try {
    // 從 query string 取得參數
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (!decodedId) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少頁面 ID' }
      }, 400);
    }
    
    await info('頁面 API', `刪除頁面: ${decodedId}`);
    
    // 先檢查頁面是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<頁面>(c, decodedId);
    if (!現有資料.success || !現有資料.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '頁面不存在' }
      }, 404);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, decodedId);
    
    if (!結果.success) {
      return c.json({
        success: false,
        error: { code: 'DELETE_FAILED', message: '刪除頁面失敗' }
      }, 500);
    }
    
    await info('頁面 API', '成功刪除頁面');
    
    return c.json({
      success: true,
      message: '頁面已刪除',
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('頁面 API', `DELETE 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '刪除頁面失敗' }
    }, 500);
  }
}

// 處理根據路徑取得頁面
async function 處理根據路徑取得頁面(c: Context, route: string): Promise<Response> {
  try {
    await info('頁面 API', `根據路徑取得頁面: ${route}`);
    
    // 使用查詢列表來根據路徑查找頁面
    const 結果 = await 三層查詢管理器.查詢列表<頁面>(c, '頁面', 100, 0);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '找不到頁面' }
      }, 404);
    }
    
    // 根據路徑查找匹配的頁面
    const 匹配頁面 = 結果.data.find(頁面 => 頁面.路徑 === route);
    
    if (!匹配頁面) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '找不到指定路徑的頁面' }
      }, 404);
    }
    
    await info('頁面 API', `成功根據路徑取得頁面: ${route} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(匹配頁面, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('頁面 API', `根據路徑取得頁面失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '根據路徑取得頁面失敗' }
    }, 500);
  }
}

// 處理取得單一頁面
async function 處理取得單一頁面(c: Context, id: string): Promise<Response> {
  try {
    await info('頁面 API', `取得單一頁面: ${id}`);
    
    const 結果 = await 三層查詢管理器.查詢單一<頁面>(c, id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '頁面不存在' }
      }, 404);
    }
    
    await info('頁面 API', `成功取得頁面: ${id} (來源: ${結果.source})`);
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('頁面 API', `取得單一頁面失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得單一頁面失敗' }
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
