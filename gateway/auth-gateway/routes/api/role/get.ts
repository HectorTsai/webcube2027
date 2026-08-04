/**
 * GET /api/role — 角色列表 API
 *
 * 回傳所有角色清單。
 * 名稱依當前語言回傳單一語言文字。
 * 支援 data-gateway CRUD 查詢參數（page、pageSize、sort、order、欄位篩選等）。
 */

import type { Context } from 'hono';
import { gwFetch } from '@dui/util';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../utils/config.ts';

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
  const dataGatewayUrl = await getDataGatewayUrl();
  const apiKey = await getDataGatewayApiKey();
  const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;

  try {
    // 將請求的查詢參數原樣傳遞給 data-gateway
    const qs = new URLSearchParams(c.req.query()).toString();
    const url = `/api/l2/使用者/角色${qs ? `?${qs}` : ''}`;

    const res = await gwFetch(c, dataGatewayUrl, url, {
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
    });
    const json = await res.json();

    if (!json.success) {
      return c.json({ success: false, error: '查詢角色失敗' }, 502);
    }

    // 解析列表中每筆角色的名稱
    const items = (json.data as Record<string, unknown>[]) || [];
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
      pagination: json.pagination,
    });
  } catch (err) {
    return c.json({
      success: false,
      error: `查詢角色列表失敗：${err instanceof Error ? err.message : String(err)}`,
    }, 502);
  }
};