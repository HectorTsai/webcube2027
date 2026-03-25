// 骨架 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import 骨架 from '../../database/models/骨架.ts';

// 內部 API 調用輔助函數
async function InnerAPI(c: Context, path: string): Promise<Response> {
  const app = c.get('app');
  return await app.request(path);
}

// ONE - 取得當前骨架 (/api/v1/skeleton)
export async function ONE(c: Context, _params: RouteParams): Promise<Response> {
  try {
    return await 處理取得當前骨架(c);
  } catch (err) {
    await error('骨架 API', `ONE 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得當前骨架失敗' }
    }, 500);
  }
}

// GET - 取得所有骨架或指定ID骨架 (/api/v1/skeletons, /api/v1/skeletons/:id)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // 如果有 ID，取得單一骨架
    if (params.id) {
      return await 處理取得單一骨架(c, params.id);
    }
    
    // 否則取得所有骨架
    return await 處理取得所有骨架(c);
    
  } catch (err) {
    await error('骨架 API', `GET 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得骨架失敗' }
    }, 500);
  }
}

// POST - 創建新骨架 (/api/v1/skeletons)
export async function POST(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<骨架>(c, '骨架', body);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'CREATE_FAILED', message: '創建骨架失敗' }
      }, 500);
    }
    
    await info('骨架 API', `創建骨架成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 過濾並格式化回應資料
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = {
      id: 結果.data.id,
      名稱: 結果.data.名稱 ? await 結果.data.名稱.toStringAsync(language) : null,
      描述: 結果.data.描述 ? await 結果.data.描述.toStringAsync(language) : null,
      售價: 結果.data.售價,
      影像: 結果.data.影像,
      佈局: 結果.data.佈局,
      風格: 結果.data.風格,
      圖示: 結果.data.圖示,
      書本樣式: 結果.data.書本樣式,
      開始動畫: 結果.data.開始動畫,
      載入器: 結果.data.載入器,
      圓角: 結果.data.圓角,
      動畫: 結果.data.動畫,
      標籤集: 結果.data.標籤集,
      最後修改: 結果.data.最後修改,
      可刪除: 結果.data.可刪除
    };

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    }, 201);
    
  } catch (err) {
    await error('骨架 API', `POST 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '創建骨架失敗' }
    }, 500);
  }
}

// PUT - 更新骨架 (/api/v1/skeletons/:id)
export async function PUT(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (!params.id) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少骨架 ID' }
      }, 400);
    }
    
    // 先檢查骨架是否存在
    const 現有資料 = await 三層查詢管理器.查詢單一<骨架>(c, '骨架', params.id);
    if (!現有資料.success || !現有資料.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '骨架不存在' }
      }, 404);
    }
    
    const body = await c.req.json();
    const 結果 = await 三層查詢管理器.創建或更新<骨架>(c, '骨架', body, params.id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新骨架失敗' }
      }, 500);
    }
    
    await info('骨架 API', `更新骨架成功: ${結果.data.id} (來源: ${結果.source})`);
    
    // 過濾並格式化回應資料
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = {
      id: 結果.data.id,
      名稱: 結果.data.名稱 ? await 結果.data.名稱.toStringAsync(language) : null,
      描述: 結果.data.描述 ? await 結果.data.描述.toStringAsync(language) : null,
      售價: 結果.data.售價,
      影像: 結果.data.影像,
      佈局: 結果.data.佈局,
      風格: 結果.data.風格,
      圖示: 結果.data.圖示,
      書本樣式: 結果.data.書本樣式,
      開始動畫: 結果.data.開始動畫,
      載入器: 結果.data.載入器,
      圓角: 結果.data.圓角,
      動畫: 結果.data.動畫,
      標籤集: 結果.data.標籤集,
      最後修改: 結果.data.最後修改,
      可刪除: 結果.data.可刪除
    };

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (err) {
    await error('骨架 API', `PUT 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '更新骨架失敗' }
    }, 500);
  }
}

// DELETE - 刪除骨架 (/api/v1/skeletons/:id)
export async function DELETE(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (!params.id) {
      return c.json({
        success: false,
        error: { code: 'MISSING_ID', message: '缺少骨架 ID' }
      }, 400);
    }
    
    const 結果 = await 三層查詢管理器.刪除(c, '骨架', params.id);
    
    if (!結果.success) {
      if (結果.error === 'DELETE_PROTECTED') {
        return c.json({
          success: false,
          error: { code: 'DELETE_PROTECTED', message: '此骨架受保護，無法刪除' }
        }, 403);
      }
      return c.json({
        success: false,
        error: { code: 'DELETE_FAILED', message: '刪除骨架失敗' }
      }, 500);
    }
    
    await info('骨架 API', `刪除骨架成功: ${params.id} (來源: ${結果.source})`);
    
    return c.json({
      success: true,
      message: '骨架已刪除',
      source: 結果.source
    });
    
  } catch (err) {
    await error('骨架 API', `DELETE 請求失敗: ${err}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '刪除骨架失敗' }
    }, 500);
  }
}

// 處理取得當前骨架（層級邏輯：系統資訊 -> 佈景主題 -> 預設）
async function 處理取得當前骨架(c: Context): Promise<Response> {
  try {
    await info('骨架 API', '開始取得當前骨架');
    
    // 1. 取得統一資訊
    const 資訊回應 = await InnerAPI(c, '/api/v1/info');
    const 資訊 = await 資訊回應.json();
    
    if (!資訊.success || !資訊.data) {
      await info('骨架 API', '無法取得資訊，回傳預設骨架');
      return await 處理取得預設骨架(c);
    }
    
    const 資訊資料 = 資訊.data;
    
    // 2. 如果有資訊中的骨架 ID，直接取得骨架
    if (資訊資料.骨架) {
      await info('骨架 API', `從資訊直接取得骨架: ${資訊資料.骨架}`);
      
      const 骨架回應 = await InnerAPI(c, `/api/v1/skeletons/${資訊資料.骨架}`);
      const 骨架結果 = await 骨架回應.json();
      
      if (骨架結果.success) {
        return c.json({
          success: true,
          data: 骨架結果.data,
          source: 'info'
        });
      }
    }
    
    // 3. 如果沒有直接骨架，從佈景主題取得
    if (資訊資料.佈景主題) {
      await info('骨架 API', `從佈景主題取得骨架: ${資訊資料.佈景主題}`);
      
      const 主題回應 = await InnerAPI(c, `/api/v1/themes/${資訊資料.佈景主題}`);
      const 主題結果 = await 主題回應.json();
      
      if (主題結果.success && 主題結果.data.骨架) {
        const 骨架回應 = await InnerAPI(c, `/api/v1/skeletons/${主題結果.data.骨架}`);
        const 骨架結果 = await 骨架回應.json();
        
        if (骨架結果.success) {
          return c.json({
            success: true,
            data: 骨架結果.data,
            source: 'theme',
            themeId: 資訊資料.佈景主題
          });
        }
      }
    }
    
    // 4. 如果都沒有，回傳預設骨架
    await info('骨架 API', '無法從系統資訊或主題取得骨架，回傳預設骨架');
    return await 處理取得預設骨架(c);
    
  } catch (錯誤) {
    await error('骨架 API', `取得當前骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得當前骨架失敗' }
    }, 500);
  }
}

// 處理取得所有骨架
async function 處理取得所有骨架(c: Context): Promise<Response> {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const 結果 = await 三層查詢管理器.查詢列表<骨架>(c, '骨架', limit, offset);
    
    await info('骨架 API', `取得骨架列表: ${結果.data?.length || 0} 筆 (來源: ${結果.source})`);
    
    // 複數 API (skeletons) 只回傳簡化資料：id, 名稱, 描述
    const language = c.get('語言') || 'zh-tw';
    const 簡化資料 = [];
    if (結果.data) {
      for (const item of 結果.data) {
        簡化資料.push({
          id: item.id,
          名稱: item.名稱 ? await item.名稱.toStringAsync(language) : null,
          描述: item.描述 ? await item.描述.toStringAsync(language) : null
        });
      }
    }

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
    await error('骨架 API', `取得骨架列表失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得骨架列表失敗' }
    }, 500);
  }
}

// 處理取得單一骨架
async function 處理取得單一骨架(c: Context, id: string): Promise<Response> {
  try {
    await info('骨架 API', `取得骨架: ${id}`);
    
    const 結果 = await 三層查詢管理器.查詢單一<骨架>(c, '骨架', id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '骨架不存在' }
      }, 404);
    }
    
    await info('骨架 API', `取得骨架: ${id} (來源: ${結果.source})`);
    
    // 過濾並格式化回應資料
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = {
      id: 結果.data.id,
      名稱: 結果.data.名稱 ? await 結果.data.名稱.toStringAsync(language) : null,
      描述: 結果.data.描述 ? await 結果.data.描述.toStringAsync(language) : null,
      售價: 結果.data.售價,
      影像: 結果.data.影像,
      佈局: 結果.data.佈局,
      風格: 結果.data.風格,
      圖示: 結果.data.圖示,
      書本樣式: 結果.data.書本樣式,
      開始動畫: 結果.data.開始動畫,
      載入器: 結果.data.載入器,
      圓角: 結果.data.圓角,
      動畫: 結果.data.動畫,
      標籤集: 結果.data.標籤集,
      最後修改: 結果.data.最後修改,
      可刪除: 結果.data.可刪除
    };

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('骨架 API', `取得骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得骨架失敗' }
    }, 500);
  }
}

// 處理取得預設骨架
async function 處理取得預設骨架(c: Context): Promise<Response> {
  try {
    const 結果 = await 三層查詢管理器.取得預設值<骨架>(c, '骨架');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設骨架' }
      }, 500);
    }
    
    await info('預設值 API', `取得預設骨架: ${結果.data.id} (來源: ${結果.source})`);
    
    // 過濾並格式化回應資料
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = {
      id: 結果.data.id,
      名稱: 結果.data.名稱 ? await 結果.data.名稱.toStringAsync(language) : null,
      描述: 結果.data.描述 ? await 結果.data.描述.toStringAsync(language) : null,
      售價: 結果.data.售價,
      影像: 結果.data.影像,
      佈局: 結果.data.佈局,
      風格: 結果.data.風格,
      圖示: 結果.data.圖示,
      書本樣式: 結果.data.書本樣式,
      開始動畫: 結果.data.開始動畫,
      載入器: 結果.data.載入器,
      圓角: 結果.data.圓角,
      動畫: 結果.data.動畫,
      標籤集: 結果.data.標籤集,
      最後修改: 結果.data.最後修改,
      可刪除: 結果.data.可刪除,
      isDefault: true,
      isSystemSeed: 結果.source === 'L1'
    };

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('預設值 API', `取得預設骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得預設骨架失敗' }
    }, 500);
  }
}

// API 模組匯出
const API: APIModule = {
  ONE: ONE,
  GET: GET,
  POST: POST,
  PUT: PUT,
  DELETE: DELETE
};

export default API;
