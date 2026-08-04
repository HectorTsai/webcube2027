/**
 * 根中介層 — 安裝檢查
 *
 * site-gateway 需要同時有 auth-gateway URL 與 data-gateway URL 才算已安裝。
 * 未安裝時僅允許 /setup 相關路徑與靜態資源。
 */

import type { Context, Next } from 'hono';
import { getConfig } from '../utils/config.ts';
import { SUPPORTED_LANGUAGE_SET } from '@dui/smartmultilingual';

/** 不需安裝即可存取的公開路徑前綴 */
const PUBLIC_PREFIXES = ['/setup', '/css/', '/images/', '/favicon'];
/** 不需安裝即可存取的 API 路徑 */
const PUBLIC_API_PATHS = ['/api/setup'];

/** 從 Accept-Language header 解析出最適合的語言 */
function detectBestLanguage(acceptHeader: string): string {
  if (!acceptHeader) return 'zh-tw';
  const parsed = acceptHeader
    .split(',')
    .map((tag) => {
      const [lang, qPart] = tag.split(';');
      const q = qPart ? parseFloat(qPart.replace('q=', '').trim()) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);
  for (const item of parsed) {
    if (SUPPORTED_LANGUAGE_SET.has(item.lang as never)) return item.lang;
  }
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
  return path === '/setup' || path.endsWith('/setup') ||
    LANG_PATH_RE.test(path) && path.replace(LANG_PATH_RE, '/').startsWith('setup');
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

  // 2. 檢查安裝狀態：需同時有 auth_gateway_url + data_gateway_url
  const config = getConfig();
  const authGwUrl = await config.get('auth_gateway_url');
  const dataGwUrl = await config.get('data_gateway_url');

  if (!authGwUrl || !dataGwUrl) {
    if (path.startsWith('/api/')) {
      return c.json({
        success: false,
        error: 'site-gateway 尚未安裝，請先完成安裝'
      }, 403);
    }
    const acceptLang = c.req.header('Accept-Language') || '';
    const lang = detectBestLanguage(acceptLang);
    return c.redirect(`/${lang}/setup`);
  }

  // 3. 已安裝
  c.set('已安裝', true);
  return await next();
}