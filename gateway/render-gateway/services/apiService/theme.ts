// 佈景主題 API 模組 - 大一統 info 智慧對齊版
import { Context } from 'hono';
import { 取得語言 } from '../index.ts';
import { APIModule, RouteParams } from './index.ts';
import { error, info } from '../../utils/logger.ts';
import { 資料池 } from '../../database/資料池.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 佈景主題 from '../../database/models/佈景主題.ts';
import { InnerAPI } from '../../services/index.ts';

// GET - 取得佈景主題 (/api/v1/theme/id 或 /api/v1/theme/id/欄位)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (params.id && params.id !== 'all') {
      const slashIdx = params.id.indexOf('/');
      if (slashIdx !== -1) {
        return await 處理取得佈景主題欄位(c, params.id.slice(0, slashIdx), params.id.slice(slashIdx + 1));
      }
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
    const 結果 = await 資料池.查詢單一<佈景主題>(id);
    
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
    const 盲撈結果 = await 資料池.取得預設值<佈景主題>('佈景主題');
    
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
  const language = await 取得語言(c);
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

// 處理取得佈景主題的巢狀欄位
async function 處理取得佈景主題欄位(c: Context, id: string, fieldPath: string): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢單一<佈景主題>(id);
    if (!結果.success || !結果.data) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: '佈景主題不存在' } }, 404);
    }
    const language = await 取得語言(c);
    const 過濾後 = await 資料過濾器.一般過濾(結果.data, language);
    const value = 取巢狀欄位(過濾後, fieldPath);
    if (value === null) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: `欄位 '${fieldPath}' 不存在` } }, 404);
    }
    return c.json({ success: true, data: value });
  } catch (錯誤) {
    await error('佈景主題 API', `取得欄位失敗: ${錯誤}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得佈景主題欄位失敗' } }, 500);
  }
}

function 取巢狀欄位(obj: Record<string, unknown>, path: string): unknown | null {
  const parts = path.split('/');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else return null;
  }
  return current;
}

const 模組: APIModule = { GET };
export default 模組;