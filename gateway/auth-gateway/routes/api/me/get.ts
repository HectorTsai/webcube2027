/**
 * GET /api/me — 回傳目前登入使用者資訊
 *
 * 從 JWT cookie 解碼回傳使用者資料。此端點為公開 API（不須登入即可存取），
 * 但回傳內容依 JWT 有效與否而不同：
 *   - 無效 token / 未登入 → { authenticated: false }
 *   - 已認證 → { authenticated: true, id, 名稱, 角色, tenant }
 *
 * 使用 `id`（composite ID）而非 `帳號` 作為使用者識別碼，
 * 以支援未來 OAuth（Google/Facebook/GitHub）等外部登入方式，
 * 不同 provider 的使用者可有不同的 `id` 格式，前端統一以 `id` 識別。
 *
 * ── CORS ──
 * 支援跨域存取（credentials: 'include'），供其他 gateway（如 data-gateway）
 * 的瀏覽器端直接呼叫。Access-Control-Allow-Origin 回應請求的 Origin header，
 * 並設定 Allow-Credentials: true。
 */

import type { Context } from 'hono';
import { verify } from 'hono/jwt';
import { extractToken } from '@dui/util/jwt';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { getKeys } from '../../../utils/keys.ts';

/** CORS headers — 回應請求的 Origin，支援跨域攜帶 cookie */
function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

export const GET = async (c: Context) => {
  const origin = c.req.header('Origin') || '';
  const token = extractToken(c);

  if (!token) {
    return c.json({ authenticated: false }, 200, corsHeaders(origin));
  }

  // 使用本地金鑰直接驗證（auth-gateway 自身不走 HTTP 取公鑰）
  let payload: Record<string, unknown> | null = null;
  try {
    const { publicKey } = getKeys();
    payload = await verify(token, publicKey, 'EdDSA') as Record<string, unknown>;
  } catch {
    // 驗證失敗 → 視為未登入
  }

  if (!payload || payload.type !== 'authenticated') {
    return c.json({ authenticated: false }, 200, corsHeaders(origin));
  }

  // 解析名稱：JWT payload 中的名稱為 MultilingualString 原始物件，依當前語言轉為單一文字
  const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;
  const nameObj = payload.名稱;
  let displayName: string;
  if (nameObj && typeof nameObj === 'object') {
    const ms = new MultilingualString(nameObj as Record<string, string>);
    displayName = await ms.toStringAsync(lang);
    // 翻譯結果（如中文→英文）預設全小寫，轉為 Title Case 美化顯示
    if (displayName) displayName = toTitleCase(displayName);
  } else if (typeof nameObj === 'string') {
    displayName = nameObj;
  } else {
    displayName = '';
  }

  return c.json({
    authenticated: true,
    id: payload.sub,
    名稱: displayName,
    角色: payload.角色,
    tenant: payload.tenant,
  }, 200, corsHeaders(origin));
};