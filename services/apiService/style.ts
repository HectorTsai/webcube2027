// 風格 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 風格 from '../../database/models/風格.ts';
import { InnerAPI } from '../../services/index.ts';

// GET - 取得風格 (/api/v1/style/id 或 /api/v1/style)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (params.id && params.id !== 'all') {
      return await 處理取得單一風格(c, params.id);
    }
    return await 處理取得當前風格(c);
    
  } catch (錯誤) {
    await error('風格 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理風格請求失敗' }
    }, 500);
  }
}

// 處理取得當前風格
async function 處理取得當前風格(c: Context): Promise<Response> {
  try {
    const 主題回應 = await InnerAPI(c, '/api/v1/theme');
    if (!主題回應.ok) {
      return await 處理取得預設風格(c);
    }
    
    const 主題資料 = await 主題回應.json();
    if (!主題資料.success || !主題資料.data || !主題資料.data.風格Id) {
      return await 處理取得預設風格(c);
    }
    
    return await 處理取得單一風格(c, 主題資料.data.風格Id);
    
  } catch (錯誤) {
    await error('風格 API', `取得當前風格失敗，切換至預設: ${錯誤}`);
    return await 處理取得預設風格(c);
  }
}

// 處理取得單一風格
async function 處理取得單一風格(c: Context, id: string): Promise<Response> {
  try {
    // 🎯 嚴格遵循大一統三層管理器精準查找，不觸碰單一 DB 實例
    const 結果 = await 三層查詢管理器.查詢單一<風格>(c, id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '風格不存在' }
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
    await error('風格 API', `取得風格失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得風格失敗' }
    }, 500);
  }
}

// 處理取得預設風格
async function 處理取得預設風格(c: Context): Promise<Response> {
  try {
    // 使用系統標準定義的 seed 規格標籤 ID 向管理器請求
    const 結果 = await 三層查詢管理器.查詢單一<風格>(c, 'seed:風格:default_style');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設風格' }
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
    await error('風格 API', `取得預設風格失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '無法取得預設風格' }
    }, 500);
  }
}

const 模組: APIModule = { GET };
export default 模組;