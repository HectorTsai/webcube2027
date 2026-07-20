// 圖示集 API 模組 — 第六金剛，語義鍵位 → 圖示 ID 對照表
import { Context } from 'hono';
import { 取得語言 } from '../index.ts';
import { APIModule, RouteParams } from './index.ts';
import { error } from '../../utils/logger.ts';
import { 資料池 } from '../../database/資料池.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import 圖示集, { 標準圖示鍵位 } from '../../database/models/圖示集.ts';

// GET - 取得圖示集 (/api/v1/icon-set/id、/api/v1/icon-set/all、/api/v1/icon-set/keys)
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    if (params.id === 'all') {
      return await 處理取得所有圖示集(c);
    }

    if (params.id === 'keys') {
      return await 處理取得標準鍵位(c);
    }

    if (params.id) {
      return await 處理取得單一圖示集(c, params.id);
    }

    return await 處理取得所有圖示集(c);

  } catch (錯誤) {
    await error('圖示集 API', `GET 請求失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '處理圖示集請求失敗' }
    }, 500);
  }
}

async function 處理取得所有圖示集(c: Context): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢列表<圖示集>('圖示集', 100, 0);
    const language = await 取得語言(c);
    // 列表回傳：只回傳名稱、描述、鍵位數量，不回傳完整的圖示映射（避免 token 爆炸）
    const 簡化資料 = 結果.data ? 結果.data.map((item: 圖示集) => {
      const filtered = 資料過濾器.一般過濾(item, language);
      const 完整個數 = Object.values(filtered.圖示映射 as Record<string, string> ?? {}).filter(v => !!v).length;
      return {
        ...filtered,
        圖示映射: undefined,
        已填鍵位數: 完整個數,
        總鍵位數: 14,
      };
    }) : [];

    return c.json({
      success: true,
      data: 簡化資料,
      source: 結果.source,
      total: 簡化資料.length,
    });
  } catch (錯誤) {
    await error('圖示集 API', `取得所有圖示集失敗: ${錯誤}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得圖示集列表失敗' } }, 500);
  }
}

async function 處理取得單一圖示集(c: Context, id: string): Promise<Response> {
  try {
    const 結果 = await 資料池.查詢單一<圖示集>(id);

    if (!結果.success || !結果.data) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: '圖示集不存在' }
      }, 404);
    }

    const language = await 取得語言(c);
    const 回應資料 = await 資料過濾器.一般過濾(結果.data, language);

    return c.json({
      success: true,
      data: 回應資料,
      source: 結果.source,
    });

  } catch (錯誤) {
    await error('圖示集 API', `取得圖示集失敗: ${錯誤}`);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '取得圖示集失敗' }
    }, 500);
  }
}

/** 回傳 14 個標準圖示鍵位清單 */
async function 處理取得標準鍵位(c: Context): Promise<Response> {
  return c.json({
    success: true,
    data: {
      鍵位: 標準圖示鍵位,
      總數: 標準圖示鍵位.length,
    },
  });
}

const 模組: APIModule = { GET };
export default 模組;
