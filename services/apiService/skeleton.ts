// 骨架 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../database/core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 骨架 from '../../database/models/骨架.ts';
import { InnerAPI } from '../../services/index.ts';

// GET - 取得骨架 (/api/v1/skeleton/id 或 /api/v1/skeleton)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (params.id && params.id !== 'all') {
      return await 處理取得單一骨架(c, params.id);
    }
    return await 處理取得當前骨架(c);
    
  } catch (錯誤) {
    await error('骨架 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理骨架請求失敗' }
    }, 500);
  }
}

// 處理取得當前骨架
async function 處理取得當前骨架(c: Context): Promise<Response> {
  try {
    const 主題回應 = await InnerAPI(c, '/api/v1/theme');
    if (!主題回應.ok) {
      return await 處理取得預設骨架(c);
    }
    
    const 主題資料 = await 主題回應.json();
    if (!主題資料.success || !主題資料.data || !主題資料.data.骨架Id) {
      return await 處理取得預設骨架(c);
    }
    
    return await 處理取得單一骨架(c, 主題資料.data.骨架Id);
    
  } catch (錯誤) {
    await error('骨架 API', `取得當前骨架失敗，切換至預設: ${錯誤}`);
    return await 處理取得預設骨架(c);
  }
}

// 處理取得單一骨架
async function 處理取得單一骨架(c: Context, id: string): Promise<Response> {
  try {
    // 🎯 嚴格透過大一統三層管理器進行資料精準查找
    const 結果 = await 三層查詢管理器.查詢單一<骨架>(c, id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '骨架不存在' }
      }, 404);
    }
    
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

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
    // 🎯 利用系統規範的固定種子代碼，向管理器發起查詢
    const 結果 = await 三層查詢管理器.查詢單一<骨架>(c, 'seed:骨架:default_skeleton');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設骨架' }
      }, 500);
    }
    
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('骨架 API', `取得預設骨架失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '無法取得預設骨架' }
    }, 500);
  }
}

const 模組: APIModule = { GET };
export default 模組;