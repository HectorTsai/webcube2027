// 網站資訊 API
import { Context } from 'hono';
import { info, error } from '../../../utils/logger.ts';
import { 三層查詢管理器 } from '../../../core/three-tier-query.ts';
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
    
    // 過濾回應資料，排除加密字串
    const language = c.get('語言') || 'zh-tw';
    const 回應資料 = {
      id: 結果.data.id,
      網址: 結果.data.網址,
      名稱: 結果.data.名稱 ? await 結果.data.名稱.toStringAsync(language) : null,
      描述: 結果.data.描述 ? await 結果.data.描述.toStringAsync(language) : null,
      商標: 結果.data.商標,
      模式: 結果.data.模式,
      佈景主題: 結果.data.佈景主題,
      配色: 結果.data.配色,
      骨架: 結果.data.骨架,
      設定: 結果.data.設定,
      版權資料: 結果.data.版權資料,
      語言: 結果.data.語言,
      預設語言: 結果.data.預設語言,
      開始日期: 結果.data.開始日期,
      結束日期: 結果.data.結束日期,
      最後修改: 結果.data.最後修改,
      可刪除: 結果.data.可刪除
    };

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
