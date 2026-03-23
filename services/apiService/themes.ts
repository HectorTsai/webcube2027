// 佈景主題 API 處理器
import { Context } from 'hono';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { info, error } from '../../utils/logger.ts';
import 佈景主題 from '../../database/models/佈景主題.ts';

// GET /api/v1/themes - 取得所有佈景主題
export async function 處理取得所有佈景主題(c: Context): Promise<Response> {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const includeSeeds = c.req.query('include_seeds') !== 'false'; // 預設包含 seeds
    
    const 結果 = await 三層查詢管理器.查詢列表<佈景主題>(c, '佈景主題', limit, offset);
    
    // 由於 KV 包含所有 seeds，查詢保證有結果
    let 資料列表 = 結果.資料 || [];
    
    // 如果不包含 seeds，過濾掉 L1 來源且不可刪除的資料
    if (!includeSeeds && 結果.來源 === 'L1') {
      資料列表 = 資料列表.filter(item => item.可刪除);
    }
    
    await info('佈景主題 API', `取得佈景主題列表: ${資料列表.length} 筆 (來源: ${結果.來源}, 包含seeds: ${includeSeeds})`);
    
    return c.json({
      success: true, // 由於有 KV seeds，保證成功
      data: 資料列表.map(item => ({
        ...item.toJSON(),
        isSystemSeed: !item.可刪除 && 結果.來源 === 'L1'
      })),
      source: 結果.來源,
      pagination: {
        limit,
        offset,
        total: 資料列表.length
      },
      meta: {
        includeSeeds,
        hasSystemSeeds: 結果.來源 === 'L1'
      }
    });
    
  } catch (錯誤) {
    await error('佈景主題 API', `取得佈景主題列表失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得佈景主題列表失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// GET /api/v1/themes/:id - 取得單一佈景主題
export async function 處理取得單一佈景主題(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少佈景主題 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.查詢單一<佈景主題>(c, '佈景主題', id);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '佈景主題不存在',
        error: 'NOT_FOUND'
      }, 404);
    }
    
    await info('佈景主題 API', `取得佈景主題: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('佈景主題 API', `取得佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得佈景主題失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// POST /api/v1/themes - 創建佈景主題
export async function 處理創建佈景主題(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    
    // 驗證必要欄位
    if (!body.名稱) {
      return c.json({
        success: false,
        message: '缺少必要欄位: 名稱',
        error: 'MISSING_REQUIRED_FIELDS'
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.創建或更新<佈景主題>(c, '佈景主題', body);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '創建佈景主題失敗',
        error: 結果.錯誤 || 'CREATE_FAILED'
      }, 500);
    }
    
    await info('佈景主題 API', `創建佈景主題成功: ${結果.資料.id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    }, 201);
    
  } catch (錯誤) {
    await error('佈景主題 API', `創建佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '創建佈景主題失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// PUT /api/v1/themes/:id - 更新佈景主題
export async function 處理更新佈景主題(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少佈景主題 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    // 先檢查佈景主題是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<佈景主題>(c, '佈景主題', id);
    if (!現有資料.成功 || !現有資料.資料) {
      return c.json({
        success: false,
        message: '佈景主題不存在',
        error: 'NOT_FOUND'
      }, 404);
    }
    
    const 結果 = await 三層查詢管理器.創建或更新<佈景主題>(c, '佈景主題', body, id);
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '更新佈景主題失敗',
        error: 結果.錯誤 || 'UPDATE_FAILED'
      }, 500);
    }
    
    await info('佈景主題 API', `更新佈景主題成功: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('佈景主題 API', `更新佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '更新佈景主題失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// DELETE /api/v1/themes/:id - 刪除佈景主題
export async function 處理刪除佈景主題(c: Context): Promise<Response> {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({
        success: false,
        message: '缺少佈景主題 ID',
        error: 'MISSING_ID'
      }, 400);
    }
    
    // 先檢查要刪除的資料是否存在
    const 查詢結果 = await 三層查詢管理器.查詢單一<佈景主題>(c, '佈景主題', id);
    
    if (!查詢結果.成功 || !查詢結果.資料) {
      return c.json({
        success: false,
        message: '佈景主題不存在',
        error: 'NOT_FOUND'
      }, 404);
    }
    
    // 檢查是否為系統 seed（來自 L1 且不可刪除）
    if (查詢結果.來源 === 'L1' && !查詢結果.資料.可刪除) {
      return c.json({
        success: false,
        message: '此佈景主題為系統預設值，無法刪除',
        error: 'SYSTEM_SEED_PROTECTED'
      }, 403);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, '佈景主題', id);
    
    if (!結果.成功) {
      if (結果.錯誤 === 'DELETE_PROTECTED') {
        return c.json({
          success: false,
          message: '此佈景主題受保護，無法刪除',
          error: 'DELETE_PROTECTED'
        }, 403);
      }
      
      return c.json({
        success: false,
        message: '刪除佈景主題失敗',
        error: 結果.錯誤 || 'DELETE_FAILED'
      }, 500);
    }
    
    await info('佈景主題 API', `刪除佈景主題成功: ${id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      message: '佈景主題已刪除',
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('佈景主題 API', `刪除佈景主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '刪除佈景主題失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}

// GET /api/v1/theme - 取得當前網站主題
export async function 處理取得當前主題(c: Context): Promise<Response> {
  try {
    // 取得預設主題
    const 結果 = await 三層查詢管理器.取得預設值<佈景主題>(c, '佈景主題');
    
    if (!結果.成功 || !結果.資料) {
      return c.json({
        success: false,
        message: '無法取得當前主題',
        error: 結果.錯誤 || 'NO_DEFAULT_THEME'
      }, 404);
    }
    
    await info('佈景主題 API', `取得當前主題: ${結果.資料.id} (來源: ${結果.來源})`);
    
    return c.json({
      success: true,
      data: 結果.資料.toJSON(),
      source: 結果.來源
    });
    
  } catch (錯誤) {
    await error('佈景主題 API', `取得當前主題失敗: ${錯誤}`);
    return c.json({
      success: false,
      message: '取得當前主題失敗',
      error: (錯誤 as Error).toString()
    }, 500);
  }
}
