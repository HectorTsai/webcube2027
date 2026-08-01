/**
 * 根中介層 — 安裝檢查
 *
 * 若 auth-gateway 尚未設定（L1 中無 data_gateway_url）：
 *   - `/:lang/setup`、`/setup`、`/api/setup`、`/api/anonymous-token`、靜態資源 → 放行
 *   - 其他 API → 回傳 403
 *   - 其他頁面 → 重新導向到 `/:lang/setup`
 */

import type { Context, Next } from 'hono';
import { getConfig } from '../utils/config.ts';
import { SUPPORTED_LANGUAGE_SET } from '@dui/smartmultilingual';

/** 不需安裝即可存取的公開路徑前綴 */
const PUBLIC_PREFIXES = ['/setup', '/css/', '/images/', '/favicon'];
/** 不需安裝即可存取的 API 路徑 */
const PUBLIC_API_PATHS = ['/api/setup', '/api/anonymous-token'];

/** 從 Accept-Language header 解析出最適合的語言 */
function detectBestLanguage(acceptHeader: string): string {
  if (!acceptHeader) return 'zh-tw';

  // 解析 Accept-Language
  const parsed = acceptHeader
    .split(',')
    .map((tag) => {
      const [lang, qPart] = tag.split(';');
      const q = qPart ? parseFloat(qPart.replace('q=', '').trim()) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  // 完全比對
  for (const item of parsed) {
    if (SUPPORTED_LANGUAGE_SET.has(item.lang as never)) return item.lang;
  }

  // 主要語系比對
  for (const item of parsed) {
    const primary = item.lang.split('-')[0];
    if (primary === item.lang) continue;
    for (const supported of SUPPORTED_LANGUAGE_SET) {
      if (typeof supported === 'string' && (supported.startsWith(primary + '-') || supported === primary)) {
        return supported;
      }
    }
  }

  return 'zh-tw';
}

/** 語言前綴路徑（如 /zh-tw/setup） */
const LANG_PATH_RE = /^\/([a-z]{2,3}(-[a-z]{2,4})?)\//;

/** 安裝頁面路徑（含語言前綴版本） */
function isSetupPage(path: string): boolean {
  return path === '/setup' || path.endsWith('/setup') || LANG_PATH_RE.test(path) && path.replace(LANG_PATH_RE, '/').startsWith('setup');
}

export async function middleware(c: Context, next: Next) {
  const path = c.req.path;

  // 1. 公開路徑直接放行
  const isPublic =
    PUBLIC_PREFIXES.some((p) => path.startsWith(p)) ||
    PUBLIC_API_PATHS.includes(path) ||
    isSetupPage(path) ||
    /\.(css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(path);

  if (isPublic) {
    return await next();
  }

  // 2. 檢查安裝狀態
  const config = getConfig();
  const dataGatewayUrl = await config.get('data_gateway_url');

  if (!dataGatewayUrl) {
    // 未安裝：API 回傳 403，頁面重新導向
    if (path.startsWith('/api/')) {
      return c.json({ success: false, error: 'auth-gateway 尚未安裝，請先完成安裝' }, 403);
    }

    // 偵測語言並導向正確的 setup 路徑
    const acceptLang = c.req.header('Accept-Language') || '';
    const lang = detectBestLanguage(acceptLang);
    return c.redirect(`/${lang}/setup`);
  }

  // 3. 已安裝
  c.set('已安裝', true);
  return await next();
}
