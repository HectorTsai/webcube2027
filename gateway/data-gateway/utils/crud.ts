/**
 * CRUD handler 共用工廠
 *
 * 各 API 層（admin/manager/member）的 handler 透過此工廠建立，
 * 只差在 host 參數（effective_host），避免重複邏輯。
 *
 * host = undefined  → 操作 L2（admin 層）
 * host = tenant     → 操作 L3（manager/member 層）
 */

import { dataPool } from '@dui/database';

const RESERVED_PARAMS = new Set([
  'page', 'pageSize', 'limit', 'offset', 'sort', 'order', 'token',
]);

function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}

// ──────────────────────────────────────────
// Collection 層級 — 自動判斷：有 : 則 getById，否則列出 model types
// ──────────────────────────────────────────

/** 取得 adapter 中指定 collection 的 model types 與計數 */
async function getModelTypes(adapter: any, collection: string): Promise<{ type: string; count: number }[]> {
  let modelTypes: string[];
  if (typeof adapter.listModelTypes === 'function') {
    modelTypes = await adapter.listModelTypes(collection);
  } else {
    const all = await adapter.list(collection);
    const models = new Set<string>();
    for (const item of all.data || all || []) {
      if (item.id && item.id.includes(':')) {
        models.add(item.id.split(':')[1]);
      }
    }
    modelTypes = Array.from(models).sort();
  }

  return Promise.all(
    modelTypes.map(async (type: string) => {
      const count = await adapter.count(collection, type);
      return { type, count };
    }),
  );
}

/** 合併 L2 + L3 的 model types（同 type 的 count 相加） */
function mergeModels(
  l2: { type: string; count: number }[],
  l3: { type: string; count: number }[],
): { type: string; count: number }[] {
  const map = new Map<string, number>();
  for (const m of l2) map.set(m.type, m.count);
  for (const m of l3) {
    map.set(m.type, (map.get(m.type) || 0) + m.count);
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
}

/**
 * GET /:collection
 *
 * 根據 `:collection` 參數自動判斷：
 *   - 含有 `:`  → 當作 composite ID，執行 getById
 *   - 不含 `:`  → 當作 collection 名稱，列出其下的 model types
 *
 * 支援 ?scope=all（或 fallback route 的 rest_path）觸發 L2+L3 合併模式。
 * L3 初始化或查詢失敗時自動降級為僅回傳 L2 資料。
 */
export async function handleCollection(c: any) {
  const param = c.req.param('collection');
  const host = c.get('effective_host');
  const rest = c.get('rest_path') || '';
  const scopeAll = c.req.query('scope') === 'all' || !!rest;

  // ── composite ID → getById ──
  if (isValidCompositeId(param)) {
    return handleGetById(c);
  }

  // ── collection 名稱 → 列出 model types ──
  try {
    const l2 = dataPool.System;
    if (!l2) {
      return c.json({ success: false, error: '資料庫尚未初始化' }, 500);
    }

    if (scopeAll && host) {
      // L2+L3 合併模式（L3 異常時自動降級）
      let l3Models: { type: string; count: number }[] = [];
      try {
        await dataPool.initL3(host);
        const l3Adapter = dataPool.get(host);
        if (l3Adapter) {
          l3Models = await getModelTypes(l3Adapter, param);
        }
      } catch (l3Err) {
        console.warn(`[handleCollection] L3 查詢失敗，降級僅回傳 L2:`, l3Err);
      }

      const l2Models = await getModelTypes(l2, param);
      const merged = mergeModels(l2Models, l3Models);

      return c.json({
        success: true,
        data: {
          collection: param,
          source: 'L2+L3',
          models: merged,
          totalModels: merged.length,
        },
      });
    }

    // 單層模式（L3 → L2 自動降級）
    if (host) {
      try {
        await dataPool.initL3(host);
        const l3 = dataPool.get(host);
        if (l3) {
          const models = await getModelTypes(l3, param);
          return c.json({
            success: true,
            data: { collection: param, source: 'L3', models, totalModels: models.length },
          });
        }
      } catch (l3Err) {
        console.warn(`[handleCollection] L3 查詢失敗，降級至 L2:`, l3Err);
      }
    }

    // 回退 L2
    const models = await getModelTypes(l2, param);
    return c.json({
      success: true,
      data: { collection: param, source: 'L2', models, totalModels: models.length },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** 從 exports 中移除，避免被誤用 */
export {};

/** GET /:collection/:model — 列表查詢 */
export async function handleList(c: any) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const host = c.get('effective_host');

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

    const sortParam = c.req.query('sort') || undefined;
    const orderParam = c.req.query('order') || undefined;
    const order = orderParam === 'asc' ? 'asc' as const : 'desc' as const;

    const filter: Record<string, string> = {};
    const queryParams = c.req.query() as Record<string, string>;
    for (const [key, val] of Object.entries(queryParams)) {
      if (val && !RESERVED_PARAMS.has(key)) filter[key] = val;
    }

    const hasFilter = Object.keys(filter).length > 0;
    const result = await dataPool.list(collection, model, {
      limit, offset,
      sort: sortParam, order,
      filter: hasFilter ? filter : undefined,
    }, host);

    // 總筆數
    let totalCount = 0;
    if (result.totalCount !== undefined) {
      // 有記憶體過濾時，pool 已回傳過濾後的總筆數
      totalCount = result.totalCount;
    } else if (host) {
      // L3 count
      await dataPool.initL3(host);
      const l3 = dataPool.get(host);
      if (l3) totalCount = await l3.count(collection, model);
    } else {
      // L2 count
      const l2 = dataPool.System;
      if (l2) totalCount = await l2.count(collection, model);
    }

    return c.json({
      success: true,
      data: result.data,
      source: result.source,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        limit, offset,
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
}

/** POST /:collection/:model — 新增紀錄 */
export async function handleCreate(c: any) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const host = c.get('effective_host');
    const body = await c.req.json();

    // ID 格式驗證
    if (body.id !== undefined) {
      if (typeof body.id !== 'string') {
        return c.json({ success: false, error: 'id 必須是字串' }, 400);
      }
      const parts = body.id.split(':');
      if (parts.length !== 3) {
        return c.json({ success: false, error: 'id 格式必須為 collection:model:nanoid' }, 400);
      }
      if (parts[0] !== collection) {
        return c.json({ success: false, error: `id collection "${parts[0]}" 不符合路由 "${collection}"` }, 400);
      }
      if (parts[1] !== model) {
        return c.json({ success: false, error: `id model "${parts[1]}" 不符合路由 "${model}"` }, 400);
      }
    }

    const result = await dataPool.create(collection, body.id || `${collection}:${model}:${crypto.randomUUID().slice(0, 8)}`, body, host);

    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    }
    return c.json({ success: false, error: result.error || '新增失敗' }, 400);
  } catch (err) {
    return c.json(
      { success: false, error: `新增失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** GET /:id — 單筆查詢 */
export async function handleGetById(c: any) {
  try {
    const id = c.req.param('id');
    const host = c.get('effective_host');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const result = await dataPool.getById(id, host);
    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    }
    return c.json({ success: false, error: '找不到資料' }, 404);
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** PUT /:id — 整筆更新 */
export async function handleUpdate(c: any) {
  try {
    const id = c.req.param('id');
    const host = c.get('effective_host');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const collection = id.split(':')[0];
    const body = await c.req.json();

    if (body.id !== undefined && body.id !== id) {
      return c.json(
        { success: false, error: `body id "${body.id}" 與路由 id "${id}" 不一致` },
        400,
      );
    }

    const result = await dataPool.update(collection, id, body, host);
    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    }
    return c.json({ success: false, error: result.error || '更新失敗' }, 400);
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** PATCH /:id — 部分更新 */
export async function handlePatch(c: any) {
  try {
    const id = c.req.param('id');
    const host = c.get('effective_host');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const collection = id.split(':')[0];
    const body = await c.req.json();

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return c.json({ success: false, error: '請求主體必須是 JSON 物件' }, 400);
    }
    if (body.id !== undefined) {
      return c.json({ success: false, error: '不允許修改 id' }, 400);
    }

    const result = await dataPool.patch(collection, id, body, host);
    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    }
    return c.json({ success: false, error: '找不到資料或更新失敗' }, 404);
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** DELETE /:id — 刪除紀錄 */
export async function handleDelete(c: any) {
  try {
    const id = c.req.param('id');
    const host = c.get('effective_host');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const result = await dataPool.deleteRecord(id, host);
    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    }
    return c.json({ success: false, error: '找不到資料或刪除失敗' }, 404);
  } catch (err) {
    return c.json(
      { success: false, error: `刪除失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}
