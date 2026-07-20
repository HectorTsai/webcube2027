// 裝飾 API 模組
import { Context } from 'hono';
import { 取得語言 } from '../index.ts';
import { APIModule, RouteParams } from './index.ts';
import { error } from '../../utils/logger.ts';
import { 資料池 } from '../../database/資料池.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 裝飾 from '../../database/models/裝飾.ts';
import { InnerAPI } from '../../services/index.ts';

// GET - 取得裝飾 (/api/v1/ornament/id 或 /api/v1/ornament/id/欄位)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // 若指定 all → 回傳全部裝飾清單
    if (params.id === 'all') {
      return await 處理取得所有裝飾(c);
    }

    if (params.id) {
      const slashIdx = params.id.indexOf('/');
      if (slashIdx !== -1) {
        return await 處理取得裝飾欄位(c, params.id.slice(0, slashIdx), params.id.slice(slashIdx + 1));
      }
      return await 處理取得單一裝飾(c, params.id);
    }
    return await 處理取得當前裝飾(c);
    
  } catch (錯誤) {
    await error('裝飾 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理裝飾請求失敗' }
    }, 500);
  }
}

// 處理取得當前裝飾
async function 處理取得當前裝飾(c: Context): Promise<Response> {
  try {
    const 主題回應 = await InnerAPI(c, '/api/v1/theme');
    if (!主題回應.ok) {
      return await 處理取得預設裝飾(c);
    }
    
    const 主題資料 = await 主題回應.json();
    if (!主題資料.success || !主題資料.data || !主題資料.data.裝飾Id) {
      return await 處理取得預設裝飾(c);
    }
    
    return await 處理取得單一裝飾(c, 主題資料.data.裝飾Id);
    
  } catch (錯誤) {
    await error('裝飾 API', `取得當前裝飾失敗，切換至預設: ${錯誤}`);
    return await 處理取得預設裝飾(c);
  }
}

// 處理取得單一裝飾
async function 處理取得單一裝飾(c: Context, id: string): Promise<Response> {
  try {
    // 🎯 嚴格遵循大一統三層管理器精準查找，不觸碰單一 DB 實例
    const 結果 = await 資料池.查詢單一<裝飾>(id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '裝飾不存在' }
      }, 404);
    }
    
    const language = await 取得語言(c);
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('裝飾 API', `取得裝飾失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得裝飾失敗' }
    }, 500);
  }
}

// 處理取得預設裝飾
async function 處理取得預設裝飾(c: Context): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢單一<裝飾>('seed:裝飾:default_ornament');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設裝飾' }
      }, 500);
    }
    
    const language = await 取得語言(c);
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source
    });
    
  } catch (錯誤) {
    await error('裝飾 API', `取得預設裝飾失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '無法取得預設裝飾' }
    }, 500);
  }
}

// 處理取得所有裝飾（列表，供 AI 參考）
async function 處理取得所有裝飾(c: Context): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢列表<裝飾>('裝飾', 100, 0);
    const language = await 取得語言(c);
    const 過濾資料 = 結果.data ? await 資料過濾器.列表過濾(結果.data, language, 'simple') : [];
    return c.json({
      success: true,
      data: 過濾資料,
      source: 結果.source,
      total: 過濾資料.length,
    });
  } catch (錯誤) {
    await error('裝飾 API', `取得所有裝飾失敗: ${錯誤}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得裝飾列表失敗' } }, 500);
  }
}

// 處理取得裝飾的巢狀欄位
async function 處理取得裝飾欄位(c: Context, id: string, fieldPath: string): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢單一<裝飾>(id);
    if (!結果.success || !結果.data) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: '裝飾不存在' } }, 404);
    }
    const language = await 取得語言(c);
    const 過濾後 = await 資料過濾器.一般過濾(結果.data, language);
    const value = 取巢狀欄位(過濾後, fieldPath);
    if (value === null) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: `欄位 '${fieldPath}' 不存在` } }, 404);
    }
    return c.json({ success: true, data: value });
  } catch (錯誤) {
    await error('裝飾 API', `取得欄位失敗: ${錯誤}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得裝飾欄位失敗' } }, 500);
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