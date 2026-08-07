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
  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const tenant = payload?.tenant as string | undefined;
  const layer = tenant ? 'l3' : 'l2';

  try {
    const qs = new URLSearchParams(c.req.query()).toString();
    const path = `/api/${layer}/%E4%BD%BF%E7%94%A8%E8%80%85/%E8%A7%92%E8%89%B2${qs ? `?${qs}` : ''}`;

    const headers: Record<string, string> = {};
    if (tenant) headers['X-Tenant'] = tenant;

    const res = await accountPool.request('GET', path, headers);
    if (!res.ok) return c.json({ success: false, error: '查詢角色失敗' }, 502);

    const body = await res.json() as Record<string, unknown>;
    if (!body?.success) return c.json({ success: false, error: '查詢角色失敗' }, 502);

    const items = (body.data as Record<string, unknown>[]) || [];
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
      pagination: body.pagination,
    });
  } catch (err) {
    return c.json({
      success: false,
      error: `查詢角色列表失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};