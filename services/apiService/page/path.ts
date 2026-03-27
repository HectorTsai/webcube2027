// 頁面路徑 API 模組 - 處理 /api/v1/page/path/{path} 格式
import { Context } from 'hono';
import { APIModule, RouteParams } from '../index.ts';
import { info, error } from '../../../utils/logger.ts';
import { 三層查詢管理器 } from '../../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../../utils/資料過濾器.ts';
import 頁面 from '../../../database/models/頁面.ts';

/**
 * 處理頁面路徑請求
 * 支援格式：/api/v1/page/path/about, /api/v1/page/path/en/home
 */
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    await info('頁面路徑 API', '處理頁面路徑請求');
    
    // 從路由參數取得路徑
    const path = params.id || ''; // 從 RouteParams.id 取得路徑參數
    
    // 處理路徑：空字串變為 "/"，其他加上 "/"
    const normalizedPath = path === '' ? '/' : `/${path}`;
    
    await info('頁面路徑 API', `處理路徑: "${path}" -> "${normalizedPath}"`);
    
    // 直接實作處理邏輯，避免循環匯入
    try {
      await info('頁面路徑 API', `根據路徑取得頁面: ${normalizedPath}`);
      
      // 使用查詢列表來根據路徑查找頁面
      const 結果 = await 三層查詢管理器.查詢列表<頁面>(c, '頁面', 100, 0);
      
      if (!結果.success || !結果.data) {
        return c.json({
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到頁面' }
        }, 404);
      }
      
      // 根據路徑查找匹配的頁面
      const 匹配頁面 = 結果.data.find(頁面 => 頁面.路徑 === normalizedPath);
      
      if (!匹配頁面) {
        return c.json({
          success: false,
          error: { code: 'NOT_FOUND', message: '找不到指定路徑的頁面' }
        }, 404);
      }
      
      await info('頁面路徑 API', `成功根據路徑取得頁面: ${normalizedPath} (來源: ${結果.source})`);
      
      // 使用資料過濾器處理多國語言和安全欄位
      const language = c.get('語言') || 'zh-tw';
      const 回應資料 = await 資料過濾器.一般過濾(匹配頁面, language);

      return c.json({
        success: true,
        data: 回應資料,
        source: 結果.source
      });
      
    } catch (錯誤) {
      await error('頁面路徑 API', `根據路徑取得頁面失敗: ${錯誤}`);
      return c.json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '根據路徑取得頁面失敗' }
      }, 500);
    }
    
  } catch (錯誤) {
    await error('頁面路徑 API', `路徑請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理頁面路徑失敗' }
    }, 500);
  }
}

// API 模組匯出
const API: APIModule = {
  GET: GET
};

export default API;
