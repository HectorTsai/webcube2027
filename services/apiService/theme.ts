// 佈景主題 API 模組 - 大一統 info 智慧對齊版
import { Context } from 'hono';
import { APIModule, RouteParams } from './index.ts';
import { error, info } from '../../utils/logger.ts';
import { 三層查詢管理器 } from '../../core/three-tier-query.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 佈景主題 from '../../database/models/佈景主題.ts';
import { InnerAPI } from '../../services/index.ts';

// GET - 取得佈景主題 (/api/v1/theme/id 或 /api/v1/theme)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (params.id && params.id !== 'all') {
      return await 處理取得單一佈景主題(c, params.id);
    }
    return await 處理取得當前佈景主題(c);
    
  } catch (錯誤) {
    await error('佈景主題 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理佈景主題請求失敗' }
    }, 500);
  }
}

// 處理取得當前佈景主題 (信任並交給具備自動滑落機制的 /api/v1/info)
async function 處理取得當前佈景主題(c: Context): Promise<Response> {
  try {
    // 1. 呼叫大一統 info 端點 (它會自己判斷要返回 網站資訊 還是 系統資訊)
    const info回應 = await InnerAPI(c, '/api/v1/info');
    if (!info回應.ok) {
      return await 處理取得預設保底佈景主題(c);
    }
    
    const info資料 = await info回應.json();
    
    if (info資料.success && info資料.data) {
      // 🎯 核心修正：精準解構 info 吐出來的真實中文欄位名稱 「佈景主題」
      const 目標主題ID = info資料.data.佈景主題;
      
      if (目標主題ID) {
        await info('佈景主題 API', `🔗 透過智慧型 info 成功感知當前佈景主題指針: ${目標主題ID}`);
        return await 處理取得單一佈景主題(c, 目標主題ID);
      }
    }
    
    return await 處理取得預設保底佈景主題(c);
    
  } catch (錯誤) {
    await error('佈景主題 API', `大一統 info 調度失敗，切換至極端保底: ${錯誤}`);
    return await 處理取得預設保底佈景主題(c);
  }
}

// 處理取得單一佈景主題
async function 處理取得單一佈景主題(c: Context, id: string): Promise<Response> {
  try {
    const 結果 = await 三層查詢管理器.查詢單一<佈景主題>(c, id);
    
    if (!結果.success || !結果.data) {
      return await 處理取得預設保底佈景主題(c);
    }
    
    return 包裝並回傳佈景主題(c, 結果.data, 結果.source);
    
  } catch (錯誤) {
    return await 處理取得預設保底佈景主題(c);
  }
}

// 最終萬一防線：如果連 info 都崩潰拿不到資料時的底層盲撈保底
async function 處理取得預設保底佈景主題(c: Context): Promise<Response> {
  try {
    const 盲撈結果 = await 三層查詢管理器.取得預設值<佈景主題>(c, '佈景主題');
    
    if (盲撈結果.success && 盲撈結果.data) {
      return 包裝並回傳佈景主題(c, 盲撈結果.data, 盲撈結果.source);
    }
    
    return c.json({
      success: false,
      error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得任何預設佈景主題' }
    }, 500);
  } catch (錯誤: any) {
    return c.json({ success: false, error: { code: 'FATAL', message: 錯誤.message } }, 500);
  }
}

/**
 * 統一包裝輸出格式，完美對齊全中文五大天王欄位
 */
async function 包裝並回傳佈景主題(c: Context, data: 佈景主題, source: string): Promise<Response> {
  const language = c.get('語言') || 'zh-tw';
  const 基礎過濾資料 = await 資料過濾器.一般過濾(data, language);

  const 回應資料 = {
    ...基礎過濾資料,
    id: data.id,
    配色: (data as any).配色 || (data as any).color,
    骨架: (data as any).骨架 || (data as any).skeleton,
    風格: (data as any).風格 || (data as any).style,
    裝飾: (data as any).裝飾 || (data as any).ornament,
    動畫: (data as any).動畫 || (data as any).animate
  };

  return c.json({
    success: true,
    data: 回應資料,
    source: source
  });
}

const 模組: APIModule = { GET };
export default 模組;