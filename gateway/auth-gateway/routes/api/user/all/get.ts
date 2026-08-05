/**
 * GET /api/user/all — 所有使用者（跨 L1/L2/L3）
 *
 * 同時查詢 data-gateway 的三層儲存（L1 記憶體、L2 SQLite、L3 Postgres），
 * 合併回傳並加上「來源」欄位標示資料來自哪一層。
 * 名稱依當前語言解析並轉為 Title Case。
 */

import type { Context } from 'hono';
import { gwFetch } from '@dui/util';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../../utils/config.ts';

const LAYERS = ['1', '2', '3'] as const;

/** 解析 MultilingualString 為單一語言文字 + Title Case */
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

/** 查詢單一層的使用者列表（只抓需要的 limit 筆，offset 為該層內偏移） */
async function fetchLayer(
  c: Context,
  baseUrl: string,
  layer: string,
  apiKey: string | null,
  limit: number,
  offset: number,
): Promise<{ items: Record<string, unknown>[]; totalCount: number }> {
  try {
    const res = await gwFetch(
      c,
      baseUrl,
      `/api/l${layer.toLowerCase()}/使用者/使用者?limit=${limit}&offset=${offset}`,
      {
        headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
      },
    );
    const json = await res.json();
    return {
      items: (json.data as Record<string, unknown>[]) || [],
      totalCount: json.pagination?.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

export const GET = async (c: Context) => {
  const dataGatewayUrl = await getDataGatewayUrl();
  if (!dataGatewayUrl) {
    return c.json({ success: false, error: 'data-gateway 尚未就緒' }, 502);
  }
  const apiKey = await getDataGatewayApiKey();
  const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;

  // 分頁參數（與 data-gateway CRUD 一致）
  const qPage = Number(c.req.query('page'));
  const qPageSize = Number(c.req.query('pageSize'));
  const page = Number.isFinite(qPage) && qPage > 0 ? qPage : 1;
  const pageSize = Number.isFinite(qPageSize) && qPageSize > 0 ? qPageSize : 50;

  // 順序填充（streaming pagination）：依 L1→L2→L3 逐層索取所需筆數
  let skip = (page - 1) * pageSize; // 跨層累計需跳過的筆數
  const data: Record<string, unknown>[] = [];
  let totalCount = 0;

  for (const layer of LAYERS) {
    if (data.length >= pageSize) break; // 已集滿，無需再查

    const want = pageSize - data.length; // 該層最多需補的筆數
    const { items, totalCount: layerTotal } = await fetchLayer(
      c, dataGatewayUrl, layer, apiKey, want, skip,
    );
    totalCount += layerTotal;

    if (skip >= layerTotal) {
      // 整層都在 skip 範圍內，跳過（不解析資料）
      skip -= layerTotal;
      continue;
    }

    for (const user of items) {
      data.push({
        id: user.id,
        帳號: user.帳號,
        名稱: await resolveName(user.名稱, lang, (user.帳號 as string) || ''),
        角色: user.角色 ?? [],
        圖示: user.圖示,
        最後登入: user.最後登入,
        來源: `L${layer}`,
      });
    }
    skip = 0;
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const offset = (page - 1) * pageSize;

  return c.json({
    success: true,
    data,
    total: totalCount,
    pagination: {
      page,
      pageSize,
      totalPages,
      limit: pageSize,
      offset,
      count: data.length,
      totalCount,
    },
  });
};