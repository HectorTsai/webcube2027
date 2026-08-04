/**
 * 根中介層 — 安裝檢查
 *
 * 若 auth-gateway 尚未設定（L1 中無 data_gateway_url）：
 *   - `/:lang/setup`、`/setup`、`/health`、靜態資源 → 放行
 *   - `/api/*` → 一律放行（API 預設公開，由各 API 目錄自己的 `_middleware.ts` 自行限制，如 login、verify-user 需已安裝）
 *   - 其他頁面 → 重新導向到 `/:lang/setup`
 */

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { getConfig } from '../utils/config.ts';
import { SUPPORTED_LANGUAGE_SET } from '@dui/smartmultilingual';

/** 不需安裝即可存取的公開路徑前綴（頁面與靜態資源；/health 自行處理 data-gateway 未就緒的 degraded 狀態） */
const PUBLIC_PREFIXES = ['/setup', '/css/', '/images/', '/favicon', '/health'];

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

  // 0. 語言注入（所有請求含 API 共用，供 gwFetch 與 handler 使用）
  // 優先使用 lang cookie（頁面選擇的語言），其次 Accept-Language（瀏覽器偏好）
  const langCookie = getCookie(c, 'lang') || '';
  const acceptLang = c.req.header('Accept-Language') || '';
  c.set('lang', detectBestLanguage(langCookie || acceptLang));

  // 1. 公開路徑直接放行
  const isPublic =
    PUBLIC_PREFIXES.some((p) => path.startsWith(p)) ||
    isSetupPage(path) ||
    /\.(css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(path);

  if (isPublic) {
    return await next();
  }

  // 2. 檢查安裝狀態
  const config = getConfig();
  const dataGatewayUrl = await config.get('data_gateway_url');
  const installed = !!dataGatewayUrl;

  // 3. `/api/*` 預設公開（不阻擋），僅注入安裝狀態供各 API 目錄的 middleware 自行限制
  if (path.startsWith('/api/')) {
    if (installed) c.set('已安裝', true);
    return await next();
  }

  if (!installed) {
    // 未安裝：頁面重新導向 setup（語言已由上方注入 context）
    const lang = c.get('lang') as string || 'zh-tw';
    return c.redirect(`/${lang}/setup`);
  }

  // 4. 已安裝
  c.set('已安裝', true);
  return await next();
}
