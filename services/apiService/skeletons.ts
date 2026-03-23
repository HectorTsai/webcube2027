// 骨架 API 處理器
import { Context } from 'hono';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { info, error } from '../../utils/logger.ts';
import 骨架 from '../../database/models/骨架.ts';

// GET /api/v1/skeletons - 取得所有骨架
export async function 處理取得所有骨架(c: Context): Promise<Response> {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const 結果 = await 三層查詢管理器.查詢列表<骨架>(c, '骨架', limit, offset);
    
    await info('骨架 API', `取得骨架列表: ${結果.資料?.length || 0} 筆 (來源: ${結果.來源})`);
    
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
    await error('骨架 API', `取得骨架列表失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得骨架列表失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// GET /api/v1/skeletons/:id - 取得單一骨架
export async function 處理取得單一骨架(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少骨架 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.查詢單一<骨架>(c, '骨架', id);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '骨架不存在',
        error: 'NOT_FOUND'
      }, 404);
    }
    
    await info('骨架 API', `取得骨架: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('骨架 API', `取得骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得骨架失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// POST /api/v1/skeletons - 創建骨架
export async function 處理創建骨架(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    
    // 驗證必要欄位
    if (!body.名稱 || !body.風格) {
      return c.json({
        success: false,
        message: '缺少必要欄位: 名稱, 風格',
        error: 'MISSING_REQUIRED_FIELDS'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.創建或更新<骨架>(c, '骨架', body);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '創建骨架失敗',
        error: 結果.錯誤 || 'CREATE_FAILED'
      }, 500);
    }
    
    await info('骨架 API', `創建骨架成功: ${結果.資料.id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    }, 201);
    
  } catch (錯誤) {
    await error('骨架 API', `創建骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '創建骨架失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// PUT /api/v1/skeletons/:id - 更新骨架
export async function 處理更新骨架(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少骨架 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    // 先檢查骨架是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<骨架>(c, '骨架', id);
    if (!現有資料.成功 || !現有資料.資料) {
      return c.json({
        success: false,
        message: '骨架不存在',
        error: 'NOT_FOUND'
      }, 404);
    }
    
    const 結果 = await 三層查詢管理器.創建或更新<骨架>(c, '骨架', body, id);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '更新骨架失敗',
        error: 結果.錯誤 || 'UPDATE_FAILED'
      }, 500);
    }
    
    await info('骨架 API', `更新骨架成功: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('骨架 API', `更新骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '更新骨架失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// DELETE /api/v1/skeletons/:id - 刪除骨架
export async function 處理刪除骨架(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少骨架 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, '骨架', id);
    
    if (!結果.成功) {
      if (結果.錯誤 === 'DELETE_PROTECTED') {
        return c.json({
          success: false,
          message: '此骨架受保護，無法刪除',
          error: 'DELETE_PROTECTED'
        }, 403);
      }
      
      return c.json({
        success: false,
        message: '刪除骨架失敗',
        error: 結果.錯誤 || 'DELETE_FAILED'
      }, 500);
    }
    
    await info('骨架 API', `刪除骨架成功: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      message: '骨架已刪除',
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('骨架 API', `刪除骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '刪除骨架失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}
