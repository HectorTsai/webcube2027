// 配色 API 處理器
import { Context } from 'hono';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { info, error } from '../../utils/logger.ts';
import 配色 from '../../database/models/配色.ts';

// GET /api/v1/colors - 取得所有配色
export async function 處理取得所有配色(c: Context): Promise<Response> {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const 結果 = await 三層查詢管理器.查詢列表<配色>(c, '配色', limit, offset);
    
    await info('配色 API', `取得配色列表: ${結果.資料?.length || 0} 筆 (來源: ${結果.來源})`);
    
    return c.json({
      success: 結果.成功,
      data: 結果.資料?.map(item => item.toJSON()) || [],
      source: 結果.來源,
      pagination: {
        limit,
        offset,
        total: 結果.資料?.length || 0
      },
      error: 結果.錯誤
    });
    
  } catch (錯誤) {
    await error('配色 API', `取得配色列表失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得配色列表失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// GET /api/v1/colors/:id - 取得單一配色
export async function 處理取得單一配色(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少配色 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.查詢單一<配色>(c, '配色', id);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '配色不存在',
        error: 'NOT_FOUND'
      }, 404);
    }
    
    await info('配色 API', `取得配色: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('配色 API', `取得配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得配色失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// POST /api/v1/colors - 創建配色
export async function 處理創建配色(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    
    // 驗證必要欄位
    if (!body.名稱 || !body.主色) {
      return c.json({
        success: false,
        message: '缺少必要欄位: 名稱, 主色',
        error: 'MISSING_REQUIRED_FIELDS'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.創建或更新<配色>(c, '配色', body);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '創建配色失敗',
        error: 結果.錯誤 || 'CREATE_FAILED'
      }, 500);
    }
    
    await info('配色 API', `創建配色成功: ${結果.資料.id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    }, 201);
    
  } catch (錯誤) {
    await error('配色 API', `創建配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '創建配色失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// PUT /api/v1/colors/:id - 更新配色
export async function 處理更新配色(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少配色 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    // 先檢查配色是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<配色>(c, '配色', id);
    if (!現有資料.成功 || !現有資料.資料) {
      return c.json({
        success: false,
        message: '配色不存在',
        error: 'NOT_FOUND'
      }, 404);
    }
    
    const 結果 = await 三層查詢管理器.創建或更新<配色>(c, '配色', body, id);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '更新配色失敗',
        error: 結果.錯誤 || 'UPDATE_FAILED'
      }, 500);
    }
    
    await info('配色 API', `更新配色成功: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('配色 API', `更新配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '更新配色失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// DELETE /api/v1/colors/:id - 刪除配色
export async function 處理刪除配色(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少配色 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, '配色', id);
    
    if (!結果.成功) {
      if (結果.錯誤 === 'DELETE_PROTECTED') {
        return c.json({
          success: false,
          message: '此配色受保護，無法刪除',
          error: 'DELETE_PROTECTED'
        }, 403);
      }
      
      return c.json({
        success: false,
        message: '刪除配色失敗',
        error: 結果.錯誤 || 'DELETE_FAILED'
      }, 500);
    }
    
    await info('配色 API', `刪除配色成功: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      message: '配色已刪除',
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('配色 API', `刪除配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '刪除配色失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}
