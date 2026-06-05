// 配色 API 模組
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { info, error } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 配色 from '../../database/models/配色.ts';
import { InnerAPI } from '../../services/index.ts';

// GET - 取得配色 (/api/v1/color?id=xxx 或 /api/v1/color)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // 優先檢查路徑參數，若指定了具體 ID，則進行穿透查詢
    if (params.id && params.id !== 'all') {
      return await 處理取得單一配色(c, params.id);
    }
    
    // 向後兼容從 query 字串取得 ID
    const id = c.req.query('id');
    const decodedId = id ? decodeURIComponent(id) : undefined;
    
    if (decodedId && decodedId !== 'all') {
      return await 處理取得單一配色(c, decodedId);
    }
    
    // 若無指定特定的 ID，則動態向內查詢當前租戶選用的配色
    return await 處理取得當前配色(c);
    
  } catch (錯誤) {
    await error('配色 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理配色請求失敗' }
    }, 500);
  }
}

// 處理取得當前配色
async function 處理取得當前配色(c: Context): Promise<Response> {
  try {
    const 主題回應 = await InnerAPI(c, '/api/v1/theme');
    if (!主題回應.ok) {
      return await 處理取得預設配色(c);
    }
    
    const 主題資料 = await 主題回應.json();
    if (!主題資料.success || !主題資料.data || !主題資料.data.配色Id) {
      return await 處理取得預設配色(c);
    }
    
    return await 處理取得單一配色(c, 主題資料.data.配色Id);
    
  } catch (錯誤) {
    await error('配色 API', `取得當前配色失敗，切換至預設: ${錯誤}`);
    return await 處理取得預設配色(c);
  }
}

// 處理取得單一配色
async function 處理取得單一配色(c: Context, id: string): Promise<Response> {
  try {
    // 🎯 嚴格透過大一統三層管理器進行資料精準查找
    const 結果 = await 三層查詢管理器.查詢單一<配色>(c, id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '配色不存在' }
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
    await error('配色 API', `取得單一配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得配色失敗' }
    }, 500);
  }
}

// 處理取得預設配色
async function 處理取得預設配色(c: Context): Promise<Response> {
  try {
    // 🎯 利用系統規範的固定種子代碼，向管理器發起查詢
    const 結果 = await 三層查詢管理器.查詢單一<配色>(c, 'seed:配色:classic_blue');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設配色' }
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
    await error('配色 API', `取得預設配色失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '無法取得預設配色' }
    }, 500);
  }
}

const 模組: APIModule = { GET };
export default 模組;