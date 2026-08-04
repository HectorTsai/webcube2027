/**
 * CRUD handler 共用工廠
 *
 * 供 L2/L3 API 層使用，只差在 host 參數（effective_host），避免重複邏輯。
 *
 * host = undefined  → 操作 L2（系統資料庫）
 * host = tenant     → 操作 L3（租戶資料庫）
 *
 * 權限判定完全由各層 `_middleware.ts` 以 X-API-Key + Gateway 註冊的
 * collection 權限表完成，handler 不重複做權限檢查。
 */

import { getDbManager } from '../services/db-manager.ts';

const RESERVED_PARAMS = new Set([
  'page', 'pageSize', 'limit', 'offset', 'sort', 'order',
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

/**
 * GET /:collection
 *
 * 根據 `:collection` 參數自動判斷：
 *   - 含有 `:`  → 當作 composite ID，執行 getById
 *   - 不含 `:`  → 當作 collection 名稱，列出其下的 model types
 *
 * 單層路由：有 effective_host → L3（不存在則報錯，不降級 L2）；無 → L2。
 */
export async function handleCollection(c: any) {
  const param = c.req.param('collection');
  const host = c.get('effective_host');

  // ── composite ID → getById ──
  if (isValidCompositeId(param)) {
    return handleGetById(c);
  }

  // ── collection 名稱 → 列出 model types ──
  try {
    const l2 = getDbManager().System;
    if (!l2) {
      return c.json({ success: false, error: '資料庫尚未初始化' }, 500);
    }

    // 單層路由：有 host → L3（不存在時明確報錯，不降級 L2）
    if (host) {
      const l3 = await getDbManager().initL3(host);
      if (!l3) {
        return c.json(
          { success: false, error: `租戶 ${host} 的 L3 資料庫不存在或未設定` },
          404,
        );
      }
      const models = await getModelTypes(l3, param);
      return c.json({
        success: true,
        data: { collection: param, source: 'L3', models, totalModels: models.length },
      });
    }

    // 無 host → L2
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

    // 分頁參數
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

    // 單層模式（有 host → L3，無 host → L2）
    const records = await getDbManager().list(collection, model, {
      limit, offset, sort: sortParam, order,
      filter: hasFilter ? filter : undefined,
    }, host);
    const source = host ? 'L3' : 'L2';

    // 總筆數：透過 adapter 計數
    const totalCount = host
      ? await getDbManager().getL3(host)?.count(collection, model) ?? 0
      : await getDbManager().System?.count(collection, model) ?? 0;

    return c.json({
      success: true,
      data: records,
      source,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        limit, offset,
        count: records?.length ?? 0,
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

    const record = await getDbManager().create(
      collection,
      body.id || `${collection}:${model}:${crypto.randomUUID().slice(0, 8)}`,
      body,
      host,
    );
    return c.json({ success: true, data: record, source: host ? 'L3' : 'L2' });
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
    // `:id` 路由直接取 id；`:collection` 路由攔截到 composite ID 時
    // 會轉呼叫本函數，此時 id 落在 `collection` param
    const id = c.req.param('id') ?? c.req.param('collection');
    const host = c.get('effective_host');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const record = await getDbManager().getById(id, host);
    if (record) {
      return c.json({ success: true, data: record, source: host ? 'L3' : 'L2' });
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

    const record = await getDbManager().update(collection, id, body, host);
    return c.json({ success: true, data: record, source: host ? 'L3' : 'L2' });
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

    const record = await getDbManager().patch(collection, id, body, host);
    if (record) {
      return c.json({ success: true, data: record, source: host ? 'L3' : 'L2' });
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

    const result = await getDbManager().deleteRecord(id, host);
    if (result.success) {
      return c.json({ success: true, source: host ? 'L3' : 'L2' });
    }
    return c.json({ success: false, error: '找不到資料或刪除失敗' }, 404);
  } catch (err) {
    return c.json(
      { success: false, error: `刪除失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}