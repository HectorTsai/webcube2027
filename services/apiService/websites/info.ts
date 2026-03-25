// 網站資訊 API
import { Context } from 'hono';
import { info, error } from '../../../utils/logger.ts';
import { 三層查詢管理器 } from '../../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../../utils/資料過濾器.ts';
import 網站資訊 from '../../../database/models/網站資訊.ts';
import { APIModule, RouteParams } from '../index.ts';

// 處理取得網站資訊
async function 處理取得網站資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    await info('網站資訊 API', '處理取得網站資訊請求');
    
    const 結果 = await 三層查詢管理器.取得預設值<網站資訊>(c, '網站資訊');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '網站資訊不存在' }
      }, 404);
    }
    
    // 使用資料過濾器處理多國語言和安全欄位
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('網站資訊 API', `取得網站資訊失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得網站資訊時發生錯誤' }
    }, 500);
  }
}

// API 模組匯出 - 實作 GET 和 ONE 方法
const API: APIModule = {
  GET: 處理取得網站資訊,
  ONE: 處理取得網站資訊
};

export default API;
