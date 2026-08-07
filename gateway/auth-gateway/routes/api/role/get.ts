/**
 * GET /api/role — 角色列表 API
 *
 * 透過 accountPool 代理查詢 data-gateway。
 * 名稱依當前語言回傳單一語言文字，轉為 Title Case。
 */

import type { Context } from 'hono';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { accountPool } from '../../../services/account-pool.ts';

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

export const GET = async (c: Context) => {
  const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;

  try {
    const qs = new URLSearchParams(c.req.query()).toString();
    const url = `/api/l2/使用者/角色${qs ? `?${qs}` : ''}`;

    const result = await accountPool.request('GET', url);
    if (!result.success) {
      return c.json({ success: false, error: '查詢角色失敗' }, 502);
    }

    const items = (result.data as Record<string, unknown>[]) || [];
    const data = await Promise.all(
      items.map(async (role) => ({
        id: role.id,
        名稱: await resolveName(role.名稱, lang, ''),
        權限: role.權限 ?? {},
      })),
    );

    return c.json({
      success: true,
      data,
      pagination: result.pagination,
    });
  } catch (err) {
    return c.json({
      success: false,
      error: `查詢角色列表失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};