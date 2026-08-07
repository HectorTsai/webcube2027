/**
 * GET /api/role/all — 所有角色（跨 L1/L2/L3）
 *
 * 同時查詢 data-gateway 的三層儲存（L1 記憶體、L2 SQLite、L3 Postgres），
 * 合併回傳並加上「來源」欄位標示資料來自哪一層。
 * 名稱依當前語言解析並轉為 Title Case。
 *
 * 透過 accountPool.request() 代理查詢。
 */

import type { Context } from 'hono';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { accountPool } from '../../../../services/account-pool.ts';

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

/** 查詢單一層的角色列表（只抓需要的 limit 筆，offset 為該層內偏移） */
async function fetchLayer(
  layer: string,
  limit: number,
  offset: number,
  tenant?: string,
): Promise<{ items: Record<string, unknown>[]; totalCount: number }> {
  try {
    const headers: Record<string, string> = {};
    if (tenant && layer === '3') headers['X-Tenant'] = tenant;

    const res = await accountPool.request(
      'GET',
      `/api/l${layer.toLowerCase()}/%E4%BD%BF%E7%94%A8%E8%80%85/%E8%A7%92%E8%89%B2?limit=${limit}&offset=${offset}`,
      headers,
    );
    if (!res.ok) return { items: [], totalCount: 0 };

    const body = await res.json() as Record<string, unknown>;
    if (!body?.success) return { items: [], totalCount: 0 };

    return {
      items: (body.data as Record<string, unknown>[]) || [],
      totalCount: (body.pagination as { totalCount?: number })?.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

export const GET = async (c: Context) => {
  const lang = (c.get('lang') || 'zh-tw') as SupportedLanguage;
  const payload = c.get('jwt_payload') as Record<string, unknown> | undefined;
  const tenant = payload?.tenant as string | undefined;

  const qPage = Number(c.req.query('page'));
  const qPageSize = Number(c.req.query('pageSize'));
  const page = Number.isFinite(qPage) && qPage > 0 ? qPage : 1;
  const pageSize = Number.isFinite(qPageSize) && qPageSize > 0 ? qPageSize : 50;

  let skip = (page - 1) * pageSize;
  const data: Record<string, unknown>[] = [];
  let totalCount = 0;

  for (const layer of LAYERS) {
    if (data.length >= pageSize) break;

    const want = pageSize - data.length;
    const { items, totalCount: layerTotal } = await fetchLayer(
      layer, want, skip, tenant,
    );
    totalCount += layerTotal;

    if (skip >= layerTotal) {
      skip -= layerTotal;
      continue;
    }

    for (const role of items) {
      data.push({
        id: role.id,
        名稱: await resolveName(role.名稱, lang, ''),
        權限: role.權限 ?? {},
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