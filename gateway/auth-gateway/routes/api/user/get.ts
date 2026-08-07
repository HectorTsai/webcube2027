/**
 * GET /api/user — 使用者列表 API
 *
 * 回傳使用者清單。依請求者權限過濾欄位。
 * 名稱依當前語言回傳單一語言文字。
 * 支援 data-gateway CRUD 查詢參數（page、pageSize、sort、order、欄位篩選等）。
 */

import type { Context } from 'hono';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { accountPool } from '../../../services/account-pool.ts';
import { 公開使用者 } from '../../../database/models/使用者.ts';
import { checkAccess } from '@dui/framework';

/** 將 MultilingualString 解析為單一語言文字，並轉為 Title Case */
async function resolveName(
  nameObj: unknown,
  lang: SupportedLanguage,
  fallback: string,
): Promise<string> {
  if (!nameObj || typeof nameObj !== 'object') return fallback;
  const ms = new MultilingualString(nameObj as Record<string, string>);
  const resolved = await ms.toStringAsync(lang);
  return resolved ? toTitleCase(resolved) : fallback;
}

/**
 * 依權限過濾單筆使用者資料。
 * isAdmin 為 true → 回傳完整資料；false → 僅回傳公開欄位。
 */
function filterUser(
  user: Record<string, unknown>,
  lang: SupportedLanguage,
  isAdmin: boolean,
): Promise<Record<string, unknown>> {
  return (async () => {
    const displayName = await resolveName(user.名稱, lang, (user.帳號 as string) || '');
    if (isAdmin) {
      return {
        id: user.id,
        帳號: user.帳號,
        名稱: displayName,
        角色: user.角色 ?? [],
        圖示: user.圖示,
        最後登入: user.最後登入,
      };
    }
    // 僅回傳公開欄位
    const pub = new 公開使用者(user as any);
    const json = pub.toJSON();
    json.名稱 = displayName;
    return json;
  })();
}

export const GET = async (c: Context) => {
  const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;

  // 判斷請求者是否有 l2/使用者 的讀權限
  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const isAdmin = payload ? checkAccess(payload, 'l2', '使用者', '讀') : false;

  // 依 tenant 決定查詢層級
  const tenant = payload?.tenant as string | undefined;
  const layer = tenant ? 'l3' : 'l2';

  try {
    const qParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(c.req.query())) {
      qParams[k] = v;
    }

    const result = await accountPool.listUsers(layer, tenant, qParams);
    if (!result.success) {
      return c.json({ success: false, error: '查詢使用者失敗' }, 502);
    }

    const items = result.data || [];
    const data = await Promise.all(
      items.map((user) => filterUser(user, lang, isAdmin)),
    );

    return c.json({
      success: true,
      data,
      pagination: result.pagination,
    });
  } catch (err) {
    return c.json({
      success: false,
      error: `查詢使用者列表失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};