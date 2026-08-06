/**
 * 根中介層 — 安裝檢查 + 語言注入 + JWT 驗證注入
 *
 * 未安裝（L1 中無 auth_gateway_url / data_gateway_url）：
 *   - `/setup`、靜態資源、`/api/health`、`/api/version` → 放行
 *   - `/api/*` → 放行（由各 API 目錄的 `_middleware.ts` 自行限制）
 *   - 其他頁面 → 重新導向到 `/:lang/setup`
 *
 * 已安裝：
 *   - 若請求攜帶 JWT，嘗試驗證（Ed25519）並將 payload 注入 Hono context，
 *     供下游 handler 讀取（依 gateway 規格書 §JWT Context 注入規則）。
 *   - 無 JWT 或驗證失敗 → 不阻擋，交由個別 handler / 頁面決定處理方式。
 */

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { extractToken, verifyToken } from '@dui/util/jwt';
import { isInstalled } from '../utils/config.ts';
import { SUPPORTED_LANGUAGE_SET } from '@dui/smartmultilingual';

/** 不需安裝即可存取的公開路徑前綴 */
const PUBLIC_PREFIXES = ['/setup', '/css/', '/images/', '/favicon', '/api/health', '/api/version'];

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

  // 0. 語言注入（所有請求含 API 共用）
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
  const installed = await isInstalled();

  // 3. `/api/*` 預設公開（不阻擋），僅注入安裝狀態
  if (path.startsWith('/api/')) {
    if (installed) c.set('已安裝', true);
    return await next();
  }

  if (!installed) {
    const lang = c.get('lang') as string || 'zh-tw';
    return c.redirect(`/${lang}/setup`);
  }

  // 4. 已安裝：嘗試 JWT 驗證並注入 context（無 JWT 不阻擋）
  c.set('已安裝', true);
  if (installed) {
    const token = extractToken(c);
    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload) {
          c.set('jwt_payload', payload);
          if (typeof payload.tenant === 'string') c.set('tenant', payload.tenant);
          c.set('jwt_type', payload.type || 'visitor');
          c.set('帳號', payload.帳號 || '');
          c.set('角色', payload.角色 || []);
          c.set('權限', payload.權限 || {});
        }
      } catch {
        // JWT 無效 → 視為未登入，由個別 handler 決定
      }
    }
  }

  return await next();
}
