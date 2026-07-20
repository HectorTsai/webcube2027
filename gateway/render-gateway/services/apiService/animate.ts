// 動畫 API 模組
import { Context } from 'hono';
import { 取得語言 } from '../index.ts';
import { APIModule, RouteParams } from './index.ts';
import { error } from '../../utils/logger.ts';
import { 資料池 } from '../../database/資料池.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import { InnerAPI } from '../../services/index.ts';

import 動畫 from '../../database/models/動畫.ts';

// GET - 取得動畫 (/api/v1/animate/id 或 /api/v1/animate/id/欄位)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // 若指定 all → 回傳全部動畫清單
    if (params.id === 'all') {
      return await 處理取得所有動畫(c);
    }

    if (params.id) {
      const slashIdx = params.id.indexOf('/');
      if (slashIdx !== -1) {
        return await 處理取得動畫欄位(c, params.id.slice(0, slashIdx), params.id.slice(slashIdx + 1));
      }
      return await 處理取得單一動畫(c, params.id);
    }
    return await 處理取得當前動畫(c);
    
  } catch (錯誤) {
    await error('動畫 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理動畫請求失敗' }
    }, 500);
  }
}

// 處理取得當前動畫
async function 處理取得當前動畫(c: Context): Promise<Response> {
  try {
    const 主題回應 = await InnerAPI(c, '/api/v1/theme');
    if (!主題回應.ok) {
      return await 處理取得預設動畫(c);
    }
    
    const 主題資料 = await 主題回應.json();
    if (!主題資料.success || !主題資料.data || !主題資料.data.動畫Id) {
      return await 處理取得預設動畫(c);
    }
    
    return await 處理取得單一動畫(c, 主題資料.data.動畫Id);
    
  } catch (錯誤) {
    await error('動畫 API', `取得當前動畫失敗，切換至預設: ${錯誤}`);
    return await 處理取得預設動畫(c);
  }
}

// 處理取得單一動畫
async function 處理取得單一動畫(c: Context, id: string): Promise<Response> {
  try {
    // 🎯 嚴格遵循大一統三層管理器精準查找，不觸碰單一 DB 實例
    const 結果 = await 資料池.查詢單一<動畫>(id);
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '動畫設定不存在' }
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
    await error('動畫 API', `取得動畫失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得動畫失敗' }
    }, 500);
  }
}

// 處理取得預設動畫
async function 處理取得預設動畫(c: Context): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢單一<動畫>('seed:動畫:default_animate');
    
    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NO_DEFAULT_AVAILABLE', message: '無法取得預設動畫' }
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
    await error('動畫 API', `取得預設動畫失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '無法取得預設動畫' }
    }, 500);
  }
}

// 處理取得所有動畫（列表，供 AI 參考）
async function 處理取得所有動畫(c: Context): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢列表<動畫>('動畫', 100, 0);
    const language = await 取得語言(c);
    const 過濾資料 = 結果.data ? await 資料過濾器.列表過濾(結果.data, language, 'simple') : [];
    return c.json({
      success: true,
      data: 過濾資料,
      source: 結果.source,
      total: 過濾資料.length,
    });
  } catch (錯誤) {
    await error('動畫 API', `取得所有動畫失敗: ${錯誤}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得動畫列表失敗' } }, 500);
  }
}

// 處理取得動畫的巢狀欄位
async function 處理取得動畫欄位(c: Context, id: string, fieldPath: string): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢單一<動畫>(id);
    if (!結果.success || !結果.data) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: '動畫不存在' } }, 404);
    }
    const language = await 取得語言(c);
    const 過濾後 = await 資料過濾器.一般過濾(結果.data, language);
    const value = 取巢狀欄位(過濾後, fieldPath);
    if (value === null) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: `欄位 '${fieldPath}' 不存在` } }, 404);
    }
    return c.json({ success: true, data: value });
  } catch (錯誤) {
    await error('動畫 API', `取得欄位失敗: ${錯誤}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得動畫欄位失敗' } }, 500);
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