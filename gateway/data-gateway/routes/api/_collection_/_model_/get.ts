/**
 * GET /api/:collection/:model
 * List all records of a specific model type within a collection.
 *
 * URL params:
 *   - collection: Collection (table) name
 *   - model: Model type (2nd segment of composite ID)
 *
 * Query params:
 *   - page / pageSize（page 從 1 開始）
 *   - limit / offset（相容舊版，page/pageSize 優先）
 *   - sort / order（排序，預設 desc）
 *   - 其餘參數自動視為欄位篩選（AND 疊加）
 */

import { dataPool } from '@dui/database';

/** 保留參數名稱 — 這些不會被當作欄位篩選 */
const RESERVED_PARAMS = new Set([
  'page', 'pageSize', 'limit', 'offset', 'sort', 'order', 'token',
]);

export const GET = async (c: any) => {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');

    // ── 解析分頁參數（page/pageSize 優先，fallback 到 limit/offset） ──
    const page = c.req.query('page');
    const pageSize = c.req.query('pageSize');

    let limit: number, offset: number;
    if (page !== undefined || pageSize !== undefined) {
      const p = Math.max(1, Number(page) || 1);
      const ps = Math.max(1, Math.min(100, Number(pageSize) || 50));
      limit = ps;
      offset = (p - 1) * ps;
    } else {
      limit = Math.min(100, Number(c.req.query('limit') ?? 50));
      offset = Math.max(0, Number(c.req.query('offset') ?? 0));
    }

    // ── 排序 ──
    const sortParam = c.req.query('sort') || undefined;
    const orderParam = c.req.query('order') || undefined;
    const order = orderParam === 'asc' ? 'asc' as const : 'desc' as const;

    // ── 欄位篩選：非保留參數 → filter ──
    const filter: Record<string, string> = {};
    const searchParams = c.req.url.split('?')[1]?.split('&') || [];
    for (const pair of searchParams) {
      const eqIdx = pair.indexOf('=');
      const key = eqIdx >= 0 ? decodeURIComponent(pair.slice(0, eqIdx)) : decodeURIComponent(pair);
      const val = eqIdx >= 0 ? decodeURIComponent(pair.slice(eqIdx + 1)) : '';
      if (!RESERVED_PARAMS.has(key) && val) {
        filter[key] = val;
      }
    }

    const result = await dataPool.list(collection, model, {
      limit, offset,
      sort: sortParam,
      order,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    console.log('[filter-debug]', JSON.stringify({ filter, sortParam, order }));

    // 取得該 model type 的總筆數（不套用 filter，顯示該 model 的全部數量）
    const l2 = dataPool.System;
    const totalCount = l2 ? await l2.count(collection, model) : 0;

    return c.json({
      success: true,
      data: result.data,
      source: result.source,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        limit,
        offset,
        count: result.data?.length ?? 0,
        totalCount,
      },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};
