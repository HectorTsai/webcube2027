// 統一資訊 API 模組 - 處理 /api/v1/info/* 路由
import { Context } from 'hono';
import { RouteParams } from './index.ts';
import { error } from '../../utils/logger.ts';
import { 資料過濾器 } from '../../utils/資料過濾器.ts';
import { 資料池 } from '../../database/資料池.ts';
import { 資料 } from '../../database/index.ts';
import { 取得語言, 取得域名 } from '../index.ts';
import { MultilingualString } from '@dui/smartmultilingual';

// ── 輔助：取原始模型實例（不含過濾） ──

async function 取原始系統資訊() {
  const 結果 = await 資料池.查詢單一('系統資訊:系統資訊:預設');
  if (!結果.success || !結果.data) return null;
  return 結果.data as Record<string, unknown>;
}

async function 取原始網站資訊(c: Context) {
  const host = 取得域名(c);
  const 結果 = await 資料池.查詢列表('網站資訊', 1, 0, host);
  if (!結果.success || !結果.data?.length) return null;
  return 結果.data[0] as unknown as Record<string, unknown>;
}

// ── 輔助：取巢狀欄位（只對 MultilingualString 做 lazy 轉換） ──

function 取巢狀欄位(raw: Record<string, unknown>, pathParts: string[]): unknown | null {
  let value: unknown = raw;
  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return value;
}

async function 過濾巢狀欄位值(c: Context, value: unknown): Promise<unknown> {
  // MultilingualString 實例轉換
  if (value instanceof MultilingualString) {
    const lang = await 取得語言(c);
    return (value as MultilingualString).toStringAsync(lang);
  }
  // 多語言格式的普通物件（如 {en: "...", zh-tw: "..."} 從資料庫反序列化而來）
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    const 語言鍵 = ['en', 'zh-tw', 'zh-cn', 'vi'];
    const 是否為多語言物件 = keys.some(k => 語言鍵.includes(k)) && keys.every(k => typeof obj[k] === 'string');
    if (是否為多語言物件) {
      const lang = await 取得語言(c);
      const strObj = value as Record<string, string>;
      return strObj[lang] || strObj['zh-tw'] || strObj['en'] || Object.values(strObj)[0];
    }
    // 一般巢狀物件：遞迴處理內部可能的多語言欄位
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = await 過濾巢狀欄位值(c, v);
    }
    return result;
  }
  return value;
}

// ── 處理取得系統資訊 ──

async function 處理取得系統資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const raw = await 取原始系統資訊();
    if (!raw) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: '系統資訊不存在' } }, 404);
    }
    const lang = await 取得語言(c);
    const 過濾後資料 = await 資料過濾器.一般過濾(raw as unknown as 資料, lang);
    return c.json({ success: true, data: 過濾後資料, source: 'system' });
  } catch (err) {
    await error('統一資訊 API', `取得系統資訊失敗: ${err}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得系統資訊失敗' } }, 500);
  }
}

// ── 處理取得網站資訊 ──

async function 處理取得網站資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const raw = await 取原始網站資訊(c);
    if (!raw) {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: '網站資訊不存在' } }, 404);
    }
    const lang = await 取得語言(c);
    const 過濾後資料 = await 資料過濾器.一般過濾(raw as unknown as 資料, lang);
    return c.json({ success: true, data: 過濾後資料, source: 'website' });
  } catch (err) {
    await error('統一資訊 API', `取得網站資訊失敗: ${err}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得網站資訊失敗' } }, 500);
  }
}

// ── 共用：取得統一資訊資料（優先網站資訊，回退系統資訊） ──

async function 取得資訊資料(c: Context): Promise<{ data?: Record<string, unknown>; source?: string; error?: { code: string; message: string } }> {
  const lang = await 取得語言(c);

  // 1. 嘗試網站資訊
  const rawWebsite = await 取原始網站資訊(c);
  if (rawWebsite) {
    const 過濾後資料 = await 資料過濾器.一般過濾(rawWebsite as unknown as 資料, lang);
    return { data: 過濾後資料 as Record<string, unknown>, source: 'website' };
  }

  // 2. 回退系統資訊
  const rawSystem = await 取原始系統資訊();
  if (rawSystem) {
    const 過濾後資料 = await 資料過濾器.一般過濾(rawSystem as unknown as 資料, lang);
    return { data: 過濾後資料 as Record<string, unknown>, source: 'system' };
  }

  return { error: { code: 'NOT_FOUND', message: '無法取得任何資訊' } };
}

// ── 處理取得統一資訊 (預設：優先網站資訊，回退系統資訊) ──

async function 處理取得統一資訊(c: Context, _params: RouteParams): Promise<Response> {
  try {
    const { data, source, error: err } = await 取得資訊資料(c);
    if (err || !data) {
      return c.json({ success: false, error: err }, 404);
    }
    return c.json({ success: true, data, source });
  } catch (err) {
    await error('統一資訊 API', `取得統一資訊失敗: ${err}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得統一資訊時發生錯誤' } }, 500);
  }
}

// ── GET 主入口 ──

export async function GET(c: Context, params: RouteParams): Promise<Response> {
  try {
    // 特定端點：需要完整過濾
    if (params.id === 'system') return await 處理取得系統資訊(c, params);
    if (params.id === 'website') return await 處理取得網站資訊(c, params);
    if (!params.id) return await 處理取得統一資訊(c, params);

    // ── 巢狀欄位存取 ──
    const fieldParts = params.id.split('/');
    const first = fieldParts[0];
    const rest = fieldParts.slice(1);

    // system/xxx → L1 直查，取得原始欄位（字串/陣列無需過濾；MultilingualString 才轉換）
    if (first === 'system') {
      const raw = await 取原始系統資訊();
      if (!raw) return c.json({ success: false, error: { code: 'NOT_FOUND', message: '系統資訊不存在' } }, 404);
      if (rest.length === 0) {
        // `/info/system` → 完整過濾
        const lang = await 取得語言(c);
        const 過濾後 = await 資料過濾器.一般過濾(raw as unknown as 資料, lang);
        return c.json({ success: true, data: 過濾後 });
      }
      const value = 取巢狀欄位(raw, rest);
      if (value === null) return c.json({ success: false, error: { code: 'NOT_FOUND', message: `欄位 '${rest.join('/')}' 不存在` } }, 404);
      return c.json({ success: true, data: await 過濾巢狀欄位值(c, value) });
    }

    // website/xxx → L3 直查，取得原始欄位
    if (first === 'website') {
      const raw = await 取原始網站資訊(c);
      if (!raw) return c.json({ success: false, error: { code: 'NOT_FOUND', message: '網站資訊不存在' } }, 404);
      if (rest.length === 0) {
        const lang = await 取得語言(c);
        const 過濾後 = await 資料過濾器.一般過濾(raw as unknown as 資料, lang);
        return c.json({ success: true, data: 過濾後 });
      }
      const value = 取巢狀欄位(raw, rest);
      if (value === null) return c.json({ success: false, error: { code: 'NOT_FOUND', message: `欄位 '${rest.join('/')}' 不存在` } }, 404);
      return c.json({ success: true, data: await 過濾巢狀欄位值(c, value) });
    }

    // 一般巢狀：優先網站，回退系統
    const rawWebsite = await 取原始網站資訊(c);
    const rawSystem = await 取原始系統資訊();
    const raw = rawWebsite || rawSystem;
    if (!raw) return c.json({ success: false, error: { code: 'NOT_FOUND', message: '無法取得任何資訊' } }, 404);

    const value = 取巢狀欄位(raw, fieldParts);
    if (value === null) return c.json({ success: false, error: { code: 'NOT_FOUND', message: `欄位 '${params.id}' 不存在` } }, 404);
    return c.json({ success: true, data: await 過濾巢狀欄位值(c, value) });

  } catch (err) {
    await error('統一資訊 API', `GET 請求失敗: ${err}`);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '取得資訊失敗' } }, 500);
  }
}

import { APIModule } from './index.ts';
const API: APIModule = { GET };
export default API;
