/**
 * L1 中介層 — API Key 驗證與權限檢查
 *
 * 與 L2/L3 中介層同構。所有 L1 CRUD 端點需提供 X-API-Key header，
 * 並比對該 Gateway 註冊時宣告的 collection 權限：
 *   - GET 請求 → 需有該 collection 的「讀: true」
 *   - POST/PUT/PATCH/DELETE → 需有該 collection 的「寫: true」
 *
 * 若 URL 段為 composite ID（含 `:`），取其第一段作為 collection 判定。
 */

import type { Context, Next } from 'hono';
import { getConfig } from '../../../services/config.ts';

/** 從 URL 路徑提取可能的 collection 名稱（composite ID 取第一段） */
function extractCollection(path: string): string | null {
  const segs = path.replace(/\/+$/, '').split('/').filter(Boolean);
  // /api/l1/{collection} 或 /api/l1/{collection}/{model}
  if (segs.length >= 3) {
    // 原始路徑是 URL 編碼的，先解碼才能正確辨識 composite ID 的 `:`
    const seg = decodeURIComponent(segs[2]);
    // composite ID（如 使用者:角色:訪客）→ 取 collection 段
    return seg.includes(':') ? seg.split(':')[0] : seg;
  }
  return null;
}

export async function middleware(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return c.json({ success: false, error: '請提供 API Key（X-API-Key header）' }, 401);
  }

  const stored = await getConfig().get('api_keys');
  if (!stored) {
    return c.json({ success: false, error: '無有效的 API Key' }, 401);
  }

  const apiKeys = JSON.parse(stored);
  const reg = apiKeys[apiKey];
  if (!reg) {
    return c.json({ success: false, error: 'API Key 無效' }, 401);
  }

  const 權限表 = reg.權限 || {};
  const method = c.req.method;
  const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const collection = extractCollection(c.req.path);

  if (collection) {
    const perms = 權限表[collection];
    if (!perms) {
      return c.json({
        success: false,
        error: `無權限操作 collection「${collection}」`,
      }, 403);
    }
    if (isWriteMethod && !perms.寫) {
      return c.json({
        success: false,
        error: `無寫入權限操作 collection「${collection}」`,
      }, 403);
    }
    if (!isWriteMethod && !perms.讀) {
      return c.json({
        success: false,
        error: `無讀取權限操作 collection「${collection}」`,
      }, 403);
    }
  } else {
    const hasAccess = Object.values(權限表 as Record<string, { 讀?: boolean; 寫?: boolean }>).some((p) =>
      isWriteMethod ? p?.寫 === true : p?.讀 === true,
    );
    if (!hasAccess) {
      return c.json({
        success: false,
        error: `無${isWriteMethod ? '寫入' : '讀取'}權限`,
      }, 403);
    }
  }

  c.set('gateway_name', reg.name);
  return await next();
}
