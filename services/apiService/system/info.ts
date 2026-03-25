// 系統資訊 API 模組 - 處理 /api/v1/system/info 路由
import { Context } from 'hono';
import { RouteParams } from '../index.ts';
import { info, error } from '../../../utils/logger.ts';
import { 資料過濾器 } from '../../../utils/資料過濾器.ts';

// GET - 取得系統資訊
export async function GET(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('系統資訊 API', '處理取得系統資訊請求');
    
    // 從 context 取得預先載入的系統資訊
    const 系統資訊 = c.get('系統資訊');
    
    if (!系統資訊) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '系統資訊不存在' }
      }, 404);
    }
    
    // 使用資料過濾器處理多國語言字串
    const language = c.get('語言') || 'zh-tw';
    const 過濾後資料 = await 資料過濾器.一般過濾(系統資訊, language);
    
    return c.json({
      success: true,
      data: 過濾後資料,
      source: 'L1'
    });
    
  } catch (錯誤) {
    await error('系統資訊 API', `取得系統資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得系統資訊時發生錯誤' }
    }, 500);
  }
}

// POST - 創建系統資訊
export async function POST(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('系統資訊 API', '處理創建系統資訊請求');
    
    const body = await c.req.json();
    const kvDB = c.get('kvDB');
    
    // 檢查是否已存在系統資訊（從 context）
    const 現有系統資訊 = c.get('系統資訊');
    if (現有系統資訊) {
      return c.json({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: '系統資訊已存在，請使用 PUT 方法更新' }
      }, 409);
    }
    
    // 創建新的系統資訊
    const 結果 = await kvDB.設定系統資訊(body);
    
    if (!結果) {
      return c.json({
        success: false,
        error: { code: 'CREATE_FAILED', message: '創建系統資訊失敗' }
      }, 500);
    }
    
    await info('系統資訊 API', '創建系統資訊成功');
    
    return c.json({
      success: true,
      data: body,
      source: 'L1'
    }, 201);
    
  } catch (錯誤) {
    await error('系統資訊 API', `創建系統資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '創建系統資訊時發生錯誤' }
    }, 500);
  }
}

// PUT - 更新系統資訊
export async function PUT(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('系統資訊 API', '處理更新系統資訊請求');
    
    const body = await c.req.json();
    const kvDB = c.get('kvDB');
    
    // 檢查系統資訊是否存在（從 context）
    const 現有系統資訊 = c.get('系統資訊');
    if (!現有系統資訊) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '系統資訊不存在，請使用 POST 方法創建' }
      }, 404);
    }
    
    // 合併現有資料和新資料
    const 更新資料 = { ...現有系統資訊, ...body };
    
    // 更新系統資訊
    const 結果 = await kvDB.設定系統資訊(更新資料);
    
    if (!結果) {
      return c.json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新系統資訊失敗' }
      }, 500);
    }
    
    await info('系統資訊 API', '更新系統資訊成功');
    
    return c.json({
      success: true,
      data: 更新資料,
      source: 'L1'
    });
    
  } catch (錯誤) {
    await error('系統資訊 API', `更新系統資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '更新系統資訊時發生錯誤' }
    }, 500);
  }
}

// DELETE - 刪除系統資訊
export async function DELETE(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('系統資訊 API', '處理刪除系統資訊請求');
    
    const kvDB = c.get('kvDB');
    
    // 檢查系統資訊是否存在（從 context）
    const 現有系統資訊 = c.get('系統資訊');
    if (!現有系統資訊) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '系統資訊不存在' }
      }, 404);
    }
    
    // 刪除系統資訊
    const 結果 = await kvDB.刪除系統資訊();
    
    if (!結果) {
      return c.json({
        success: false,
        error: { code: 'DELETE_FAILED', message: '刪除系統資訊失敗' }
      }, 500);
    }
    
    await info('系統資訊 API', '刪除系統資訊成功');
    
    return c.json({
      success: true,
      message: '系統資訊已刪除',
      source: 'L1'
    });
    
  } catch (錯誤) {
    await error('系統資訊 API', `刪除系統資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '刪除系統資訊時發生錯誤' }
    }, 500);
  }
}
