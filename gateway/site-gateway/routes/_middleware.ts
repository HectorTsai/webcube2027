/**
 * 根中介層 — 安裝檢查 + 無網站引導 + 語言注入 + JWT 驗證注入
 *
 * 階段引導（bootstrap 頁面僅在對應階段放行）：
 *   階段一：未安裝（L1 中無 auth_gateway_url / data_gateway_url）
 *     - 僅 `/setup` 頁面放行；其餘頁面 → 重新導向到 `/:lang/setup`
 *   階段二：已安裝但 L2 `網站資訊` 還沒有任何網站
 *     - 僅 `/apply` 頁面放行（申請網站＋建立管理員）；`/setup` 與其餘頁面
 *       → 重新導向到 `/:lang/apply`
 *   階段三：已安裝且已有網站
 *     - `/setup`、`/apply` 皆不再需要 → 重新導向到 `/:lang/`
 *     - 若請求攜帶 JWT，嘗試驗證（Ed25519）並將 payload 注入 Hono context，
 *       供下游 handler 讀取（依 gateway 規格書 §JWT Context 注入規則）。
 *
 * 靜態資源、`/api/health`、`/api/version` 與 `/api/*` 一律放行
 * （`/api/*` 由各 API 目錄的 `_middleware.ts` 自行限制）。
 */

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { extractToken, verifyToken } from '@dui/util/jwt';
import { isInstalled } from '../utils/config.ts';
import { hasAnySite } from '../services/site-pool.ts';
import { SUPPORTED_LANGUAGE_SET } from '@dui/smartmultilingual';

/** 永遠公開的路徑前綴（靜態資源與系統端點；bootstrap 頁面不在此列） */
const PUBLIC_PREFIXES = ['/css/', '/images/', '/favicon', '/api/health', '/api/version'];

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

/** 申請網站頁面路徑（含語言前綴版本） */
function isApplyPage(path: string): boolean {
  return path === '/apply' || path.endsWith('/apply') ||
    LANG_PATH_RE.test(path) && path.replace(LANG_PATH_RE, '/').startsWith('apply');
}

export async function middleware(c: Context, next: Next) {
  const path = c.req.path;

  // 0. 語言注入（所有請求含 API 共用）
  const langCookie = getCookie(c, 'lang') || '';
  const acceptLang = c.req.header('Accept-Language') || '';
  c.set('lang', detectBestLanguage(langCookie || acceptLang));
  const lang = c.get('lang') as string || 'zh-tw';

  // 1. 靜態資源與系統端點永遠放行（bootstrap 頁面 setup/apply 交由階段邏輯管制）
  const isStatic =
    PUBLIC_PREFIXES.some((p) => path.startsWith(p)) ||
    /\.(css|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(path);

  if (isStatic) {
    return await next();
  }

  // 2. 安裝狀態
  const installed = await isInstalled();

  // 3. `/api/*` 預設公開（不阻擋），僅注入安裝狀態
  if (path.startsWith('/api/')) {
    if (installed) c.set('已安裝', true);
    return await next();
  }

  // 4. 階段一：未安裝 → 僅 /setup 可用
  if (!installed) {
    if (isSetupPage(path)) return await next();
    return c.redirect(`/${lang}/setup`);
  }

  // 5. 階段二：已安裝但沒有網站 → 僅 /apply 可用（連 /setup 也導向 apply）
  const hasSite = await hasAnySite();
  if (!hasSite) {
    if (isApplyPage(path)) return await next();
    return c.redirect(`/${lang}/apply`);
  }

  // 6. 階段三：已安裝且有網站 → bootstrap 頁面（setup/apply）不再需要，導回首頁
  if (isSetupPage(path) || isApplyPage(path)) {
    return c.redirect(`/${lang}/`);
  }

  // 7. 嘗試 JWT 驗證並注入 context（無 JWT 不阻擋，交由個別 handler 決定）
  c.set('已安裝', true);
  {
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
