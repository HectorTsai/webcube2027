/**
 * GET /api/user/all — 所有使用者（跨 L1/L2/L3）
 *
 * 查詢 data-gateway 的三層儲存，合併回傳並加上「來源」欄位。
 * 全部透過 accountPool.request() 代理，不直接打 data-gateway。
 */

import type { Context } from 'hono';
import { MultilingualString, type SupportedLanguage } from '@dui/smartmultilingual';
import { toTitleCase } from '@std/text/unstable-to-title-case';
import { accountPool } from '../../../../services/account-pool.ts';
import { canViewFullUserData, 公開使用者 } from '../../../../database/models/使用者.ts';

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

/** 查詢單一層的使用者列表（透過 accountPool 代理） */
async function fetchLayer(
  layer: string,
  limit: number,
  offset: number,
  tenant?: string,
): Promise<{ items: Record<string, unknown>[]; totalCount: number }> {
  try {
    const headers: Record<string, string> = {};
    if (tenant && layer === '3') headers['X-Tenant'] = tenant;

    const result = await accountPool.request(
      'GET',
      `/api/l${layer.toLowerCase()}/使用者/使用者?limit=${limit}&offset=${offset}`,
      headers,
    );
    return {
      items: (result.data as Record<string, unknown>[]) || [],
      totalCount: (result.pagination as { totalCount?: number })?.totalCount ?? 0,
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

    for (const user of items) {
      const displayName = await resolveName(user.名稱, lang, (user.帳號 as string) || '');
      if (canViewFullUserData(payload, user.id as string)) {
        data.push({
          id: user.id,
          帳號: user.帳號,
          名稱: displayName,
          角色: user.角色 ?? [],
          圖示: user.圖示,
          最後登入: user.最後登入,
          來源: `L${layer}`,
        });
      } else {
        const pub = new 公開使用者(user as any);
        const pubJson = pub.toJSON();
        pubJson.名稱 = displayName;
        pubJson.來源 = `L${layer}`;
        data.push(pubJson as Record<string, unknown>);
      }
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