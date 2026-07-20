// 語言 API 模組 - 處理 /api/v1/language 路由
import { Context } from 'hono';
import { RouteParams } from './index.ts';
import { InnerAPI } from '../index.ts';

/**
 * GET /api/v1/language
 * 解析當前請求的語言，優先序：
 *   1. Cookie lang
 *   2. Accept-Language
 *   3. 系統預設語言（/info/system/預設語言 — 純字串欄位，不觸發過濾循環）
 *   4. zh-tw
 * 解析完成後驗證是否在網站支援語言列表中（/info/website/語言）
 */
export async function GET(c: Context, params: RouteParams): Promise<Response> {
  // ── 捷徑：語言相關查詢統一走 language API ──
  if (params.id === '預設語言') {
    return await InnerAPI(c, '/api/v1/info/system/預設語言');
  }
  if (params.id === '可用語言') {
    return await InnerAPI(c, '/api/v1/info/website/語言');
  }

  // ── 無 id：解析當前請求語言 ──
  let lang = '';

  // 1. Cookie lang
  const cookieLang = (c.req.header('cookie') || '').match(/lang=([^;]+)/)?.[1];
  if (cookieLang) {
    lang = cookieLang;
  }

  // 2. Accept-Language
  if (!lang) {
    const acceptLang = c.req.header('Accept-Language');
    if (acceptLang) {
      const first = acceptLang.split(',')[0].split(';')[0].trim().toLowerCase();
      const langMap: Record<string, string> = {
        'zh-tw': 'zh-tw', 'zh-hk': 'zh-tw', 'zh': 'zh-tw',
        'en-us': 'en', 'en-gb': 'en', 'en': 'en',
        'vi-vn': 'vi', 'vi': 'vi',
        'ja-jp': 'ja', 'ja': 'ja',
        'ko-kr': 'ko', 'ko': 'ko',
      };
      lang = langMap[first] || '';
    }
  }

  // 3. 系統預設語言（巢狀欄位直查，不經過完整過濾，不觸發循環）
  if (!lang) {
    try {
      const res = await InnerAPI(c, '/api/v1/info/system/預設語言');
      if (res.ok) {
        const body = await res.json();
        if (body.success && typeof body.data === 'string' && body.data.length > 0) {
          lang = body.data;
        }
      }
    } catch { /* fallthrough */ }
  }

  // 4. 最終 fallback
  if (!lang) {
    lang = 'zh-tw';
  }

  // ── 網站語言白名單驗證 ──
  try {
    const res = await InnerAPI(c, '/api/v1/info/website/語言');
    if (res.ok) {
      const body = await res.json();
      if (body.success && Array.isArray(body.data) && body.data.length > 0) {
        const allowedLangs = body.data as string[];
        if (!allowedLangs.includes(lang)) {
          // 不允許的語言 → 取白名單第一項
          lang = allowedLangs[0];
        }
      }
    }
  } catch { /* 網站不存在時忽略驗證 */ }

  return c.json({ success: true, data: { 語言: lang } });
}

import { APIModule } from './index.ts';
const API: APIModule = { GET };
export default API;
