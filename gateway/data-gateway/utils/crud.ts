/**
 * CRUD handler 共用工廠（統一 L1/L2/L3）
 *
 * 供 L1/L2/L3 API 層使用：
 *   - layer: 'L1'（opts 傳入）  → 操作 L1（getL1，data-gateway 本機 bootstrap 資料）
 *   - layer 未指定（預設）      → 依 effective_host 路由：有 host → L3，無 → L2
 *
 * 權限判定完全由各層 `_middleware.ts` 以 X-API-Key + Gateway 註冊的
 * collection 權限表完成，handler 不重複做權限檢查。
 *
 * 批次支援：
 *   - PUT/PATCH/DELETE /:collection/:model—body 為 JSON 陣列，限同 collection/model
 *   - PUT/PATCH/DELETE /{level}（如 /api/l2/）—body 為 JSON 陣列，每筆依 composite ID
 *     自動決定 collection，可跨 collection/model（適合 pool flush 等場景）
 *   - POST /:collection/:model—body 為陣列時亦為批次建立
 */

import { getDbManager } from '../services/db-manager.ts';
import { writeAuditLog } from '../services/audit.ts';

const RESERVED_PARAMS = new Set([
  'page', 'pageSize', 'limit', 'offset', 'sort', 'order',
]);

/** 單次批次操作上限（與列表 pageSize 上限一致） */
const MAX_BATCH_SIZE = 100;

/** L1/L2/L3 共用 handler 的選項；L2/L3 預設依 effective_host 路由 */
export interface CrudHandlerOptions {
  layer?: 'L1';
}

type Source = 'L1' | 'L2' | 'L3';

function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** 依路由 collection/model 驗證 id；合法回傳 null，否則回傳失敗原因 */
function validateRouteId(
  id: unknown,
  collection: string,
  model: string,
): { id: string; error: string } | null {
  if (typeof id !== 'string') return { id: String(id ?? ''), error: 'id 必須是字串' };
  if (!isValidCompositeId(id)) return { id, error: 'id 格式必須為 collection:model:nanoid' };
  const [ic, im] = id.split(':');
  if (ic !== collection) {
    return { id, error: `id collection "${ic}" 不符合路由 "${collection}"` };
  }
  if (im !== model) {
    return { id, error: `id model "${im}" 不符合路由 "${model}"` };
  }
  return null;
}

// ──────────────────────────────────────────
// 目標解析 — 統一 L1/L2/L3 的資料存取
// ──────────────────────────────────────────

interface DataAccess {
  getById(id: string): Promise<any | null>;
  list(collection: string, model?: string, options?: any): Promise<any[]>;
  count(collection: string, model?: string): Promise<number>;
  create(collection: string, id: string, data: any): Promise<any>;
  update(collection: string, id: string, data: any): Promise<any>;
  patch(collection: string, id: string, fields: any): Promise<any | null>;
  delete(id: string): Promise<boolean>;
}

interface ResolvedTarget {
  access: DataAccess;
  source: Source;
  host?: string;
}

/**
 * 解析操作目標。
 * L1 → getL1()；L2/L3 → getDbManager() 依 effective_host 路由（有 host → L3，無 → L2）。
 * 目標層級未初始化時回傳錯誤物件（含 HTTP status）。
 */
function resolveAccess(
  c: any,
  opts?: CrudHandlerOptions,
): ResolvedTarget | { error: string; status: number } {
  if (opts?.layer === 'L1') {
    const adapter = getDbManager().L1;
    if (!adapter) return { error: 'L1 尚未初始化', status: 500 };
    return {
      source: 'L1',
      access: {
        getById: (id) => adapter.getById(id),
        list: (collection, model, options) => adapter.list(collection, model, options),
        count: (collection, model) => adapter.count(collection, model),
        create: (collection, id, data) => adapter.create(collection, id, data),
        update: (collection, id, data) => adapter.update(collection, id, data),
        patch: (collection, id, fields) => adapter.patch(collection, id, fields),
        delete: (id) => adapter.delete(id),
      },
    };
  }

  const host = c.get('effective_host');
  const db = getDbManager();

  if (host) {
    return {
      source: 'L3',
      host,
      access: {
        getById: (id) => db.getById(id, host),
        list: (collection, model, options) => db.list(collection, model, options, host),
        count: async (collection, model) => (await db.initL3(host))?.count(collection, model) ?? 0,
        create: (collection, id, data) => db.create(collection, id, data, host),
        update: (collection, id, data) => db.update(collection, id, data, host),
        patch: (collection, id, fields) => db.patch(collection, id, fields, host),
        delete: async (id) => (await db.deleteRecord(id, host)).success,
      },
    };
  }

  const system = db.System;
  if (!system) return { error: '資料庫尚未初始化', status: 500 };
  return {
    source: 'L2',
    access: {
      getById: (id) => db.getById(id),
      list: (collection, model, options) => db.list(collection, model, options),
      count: (collection, model) => system.count(collection, model),
      create: (collection, id, data) => db.create(collection, id, data),
      update: (collection, id, data) => db.update(collection, id, data),
      patch: (collection, id, fields) => db.patch(collection, id, fields),
      delete: async (id) => (await db.deleteRecord(id)).success,
    },
  };
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
 * L1：flat 回應（{ success, collection, modelTypes }）；L2/L3：單層路由
 * （有 effective_host → L3 不存在則報錯不降級；無 → L2）。
 */
export async function handleCollection(c: any, opts?: CrudHandlerOptions) {
  const param = c.req.param('collection');

  // ── composite ID → getById ──
  if (isValidCompositeId(param)) {
    return handleGetById(c, opts);
  }

  // ── collection 名稱 → 列出 model types ──
  try {
    if (opts?.layer === 'L1') {
      const adapter = getDbManager().L1;
      if (!adapter) {
        return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
      }
      const modelTypes = (await getModelTypes(adapter, param)).map((m) => m.type);
      return c.json({ success: true, collection: param, modelTypes });
    }

    const host = c.get('effective_host');
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
      { success: false, error: `查詢失敗: ${errMsg(err)}` },
      500,
    );
  }
}

// ──────────────────────────────────────────
// 批次 — 共用結果累加器與回應
// ──────────────────────────────────────────

interface BatchRunInput {
  source: Source;
  host?: string;
  collection: string;
  model: string;
  items: unknown[];
  action: string;
  label: string;
}

interface BatchItemResult {
  id: string;
  error?: string;
}

/** 逐筆執行並彙整 成功/失敗/失敗原因，寫一條審計日誌後回傳批次回應 */
async function runBatch(
  c: any,
  input: BatchRunInput,
  run: (item: unknown, index: number) => Promise<BatchItemResult>,
): Promise<Response> {
  const { source, host, collection, model, items, action, label } = input;
  const 成功: string[] = [];
  const 失敗: string[] = [];
  const 失敗原因: Record<string, string> = {};

  for (let i = 0; i < items.length; i++) {
    const r = await run(items[i], i);
    if (r.error) {
      失敗.push(r.id);
      失敗原因[r.id] = r.error;
    } else {
      成功.push(r.id);
    }
  }

  writeAuditLog({
    操作者: (c.get('gateway_name') as string) || 'unknown',
    動作: action,
    層級: source,
    目標: `${collection}:${model}（${items.length} 筆）`,
    租戶: host || null,
    變更摘要: `批量${label} ${collection} ${model}：成功 ${成功.length}/${items.length}`,
  }).catch(() => {});

  return c.json({
    success: true,
    source,
    data: {
      count: items.length,
      成功筆數: 成功.length,
      失敗筆數: 失敗.length,
      成功,
      失敗,
      失敗原因,
    },
  });
}

/** 解析批次 body：必須為非空 JSON 陣列且不超過上限 */
async function readBatch(c: any): Promise<{ items?: unknown[]; error?: string; status?: number }> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return { error: '請求主體必須是合法 JSON', status: 400 };
  }
  if (!Array.isArray(body)) {
    return { error: '批次操作需傳入 JSON 陣列', status: 400 };
  }
  if (body.length === 0) {
    return { error: '批次陣列不可為空', status: 400 };
  }
  if (body.length > MAX_BATCH_SIZE) {
    return { error: `單次最多 ${MAX_BATCH_SIZE} 筆`, status: 400 };
  }
  return { items: body };
}

// ──────────────────────────────────────────
// CRUD handlers
// ──────────────────────────────────────────

/** GET /:collection/:model — 列表查詢 */
export async function handleList(c: any, opts?: CrudHandlerOptions) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source } = target;

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

    const records = await access.list(collection, model, {
      limit, offset, sort: sortParam, order,
      filter: hasFilter ? filter : undefined,
    });

    // 總筆數：透過 adapter 計數
    const totalCount = await access.count(collection, model);

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
      { success: false, error: `查詢失敗: ${errMsg(err)}` },
      500,
    );
  }
}

/** POST /:collection/:model — 新增紀錄（body 為陣列 → 批次建立） */
export async function handleCreate(c: any, opts?: CrudHandlerOptions) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;
    const body = await c.req.json();

    // ── 批次建立（body 為陣列）──
    if (Array.isArray(body)) {
      if (body.length === 0) return c.json({ success: false, error: '批次陣列不可為空' }, 400);
      if (body.length > MAX_BATCH_SIZE) {
        return c.json({ success: false, error: `單次最多 ${MAX_BATCH_SIZE} 筆` }, 400);
      }
      return await runBatch(
        c,
        { source, host, collection, model, items: body, action: 'CREATE', label: '建立' },
        async (item, i) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return { id: `(第 ${i + 1} 筆)`, error: '每一筆必須是 JSON 物件' };
          }
          const rec = item as Record<string, unknown>;
          const rawId = rec.id;
          if (rawId !== undefined) {
            const bad = validateRouteId(rawId, collection, model);
            if (bad) return bad;
          }
          const id = typeof rawId === 'string'
            ? rawId
            : `${collection}:${model}:${crypto.randomUUID().slice(0, 8)}`;

          // POST = 新增：已存在不覆寫（改用 PUT）
          const existing = await access.getById(id).catch(() => null);
          if (existing) return { id, error: '已存在，請改用 PUT 覆寫' };

          try {
            const record = await access.create(collection, id, rec);
            return { id: record.id };
          } catch (err) {
            return { id, error: `寫入失敗: ${errMsg(err)}` };
          }
        },
      );
    }

    // ── 單筆建立 ──
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

    const finalId = body.id || `${collection}:${model}:${crypto.randomUUID().slice(0, 8)}`;

    // 已存在 → 409（POST = 新增，不覆寫）
    const existing = await access.getById(finalId).catch(() => null);
    if (existing) {
      return c.json({ success: false, error: `已存在：${finalId}` }, 409);
    }

    const record = await access.create(collection, finalId, body);
    // 非同步寫入審計日誌，不阻塞回應
    writeAuditLog({
      操作者: (c.get('gateway_name') as string) || 'unknown',
      動作: 'CREATE',
      層級: source,
      目標: record.id,
      租戶: host || null,
      變更摘要: `建立 ${collection} ${model}`,
    }).catch(() => {});
    return c.json({ success: true, data: record, source });
  } catch (err) {
    return c.json(
      { success: false, error: `新增失敗: ${errMsg(err)}` },
      500,
    );
  }
}

/** GET /:id — 單筆查詢 */
export async function handleGetById(c: any, opts?: CrudHandlerOptions) {
  try {
    // `:id` 路由直接取 id；`:collection` 路由攔截到 composite ID 時
    // 會轉呼叫本函數，此時 id 落在 `collection` param
    const id = c.req.param('id') ?? c.req.param('collection');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source } = target;

    const record = await access.getById(id);
    if (record) {
      return c.json({ success: true, data: record, source });
    }
    return c.json({ success: false, error: '找不到資料' }, 404);
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${errMsg(err)}` },
      500,
    );
  }
}

/** PUT /:id — 整筆更新（單筆） */
export async function handleUpdate(c: any, opts?: CrudHandlerOptions) {
  try {
    const id = c.req.param('id');

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

    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const record = await access.update(collection, id, body);
    writeAuditLog({
      操作者: (c.get('gateway_name') as string) || 'unknown',
      動作: 'UPDATE',
      層級: source,
      目標: id,
      租戶: host || null,
      變更摘要: `更新 ${collection} ${id}`,
    }).catch(() => {});
    return c.json({ success: true, data: record, source });
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${errMsg(err)}` },
      500,
    );
  }
}

/** PATCH /:id — 部分更新（單筆） */
export async function handlePatch(c: any, opts?: CrudHandlerOptions) {
  try {
    const id = c.req.param('id');

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

    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const record = await access.patch(collection, id, body);
    if (record) {
      writeAuditLog({
        操作者: (c.get('gateway_name') as string) || 'unknown',
        動作: 'PATCH',
        層級: source,
        目標: id,
        租戶: host || null,
        變更摘要: `部分更新 ${collection} ${id}`,
      }).catch(() => {});
      return c.json({ success: true, data: record, source });
    }
    return c.json({ success: false, error: '找不到資料或更新失敗' }, 404);
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${errMsg(err)}` },
      500,
    );
  }
}

/** DELETE /:id — 刪除紀錄（單筆） */
export async function handleDelete(c: any, opts?: CrudHandlerOptions) {
  try {
    const id = c.req.param('id');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const ok = await access.delete(id);
    if (ok) {
      const collection = id.split(':')[0];
      writeAuditLog({
        操作者: (c.get('gateway_name') as string) || 'unknown',
        動作: 'DELETE',
        層級: source,
        目標: id,
        租戶: host || null,
        變更摘要: `刪除 ${collection} ${id}`,
      }).catch(() => {});
      return c.json({ success: true, data: { id }, source });
    }
    return c.json({ success: false, error: '找不到資料或刪除失敗' }, 404);
  } catch (err) {
    return c.json(
      { success: false, error: `刪除失敗: ${errMsg(err)}` },
      500,
    );
  }
}

// ═══════════════════════════════════════════════
//  Level batch — PUT/PATCH/DELETE /{level}/（跨 collection/model）
// ═══════════════════════════════════════════════

/** PUT /{level}/（如 /api/l2/）— 批次整筆更新，body 為 JSON 陣列，每筆依 composite ID 自動決定 collection */
export async function handleLevelBatchUpdate(c: any, opts?: CrudHandlerOptions) {
  try {
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const batch = await readBatch(c);
    if (batch.error) return c.json({ success: false, error: batch.error }, batch.status ?? 400);
    const items = batch.items!;

    return await runBatch(
      c,
      { source, host, collection: '(multi)', model: '(multi)', items, action: 'UPDATE', label: '更新' },
      async (item, i) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return { id: `(第 ${i + 1} 筆)`, error: '每一筆必須是 JSON 物件' };
        }
        const rec = item as Record<string, unknown>;
        const id = rec.id;
        if (typeof id !== 'string' || !isValidCompositeId(id)) {
          return { id: id === undefined ? `(第 ${i + 1} 筆)` : String(id), error: `無效的 composite ID：需 collection:model:nanoid` };
        }
        const collection = id.split(':')[0];
        try {
          const record = await access.update(collection, id, rec);
          return { id: record.id };
        } catch (err) {
          return { id, error: `更新失敗: ${errMsg(err)}` };
        }
      },
    );
  } catch (err) {
    return c.json({ success: false, error: `更新失敗: ${errMsg(err)}` }, 500);
  }
}

/** PATCH /{level}/ — 批次部分更新，body 為 JSON 陣列，每筆依 composite ID 決定 collection/model */
export async function handleLevelBatchPatch(c: any, opts?: CrudHandlerOptions) {
  try {
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const batch = await readBatch(c);
    if (batch.error) return c.json({ success: false, error: batch.error }, batch.status ?? 400);
    const items = batch.items!;

    return await runBatch(
      c,
      { source, host, collection: '(multi)', model: '(multi)', items, action: 'PATCH', label: '部分更新' },
      async (item, i) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return { id: `(第 ${i + 1} 筆)`, error: '每一筆必須是 JSON 物件' };
        }
        const rec = item as Record<string, unknown>;
        const id = rec.id;
        if (typeof id !== 'string' || !isValidCompositeId(id)) {
          return { id: id === undefined ? `(第 ${i + 1} 筆)` : String(id), error: `無效的 composite ID` };
        }
        const collection = id.split(':')[0];
        const fields = { ...rec };
        delete fields.id;
        try {
          const record = await access.patch(collection, id, fields);
          if (record) return { id: record.id };
          return { id, error: '找不到資料或更新失敗' };
        } catch (err) {
          return { id, error: `部分更新失敗: ${errMsg(err)}` };
        }
      },
    );
  } catch (err) {
    return c.json({ success: false, error: `部分更新失敗: ${errMsg(err)}` }, 500);
  }
}

/** DELETE /{level}/ — 批次刪除，body 為 id 陣列（或含 id 之物件陣列），每筆依 composite ID 決定 collection */
export async function handleLevelBatchDelete(c: any, opts?: CrudHandlerOptions) {
  try {
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const batch = await readBatch(c);
    if (batch.error) return c.json({ success: false, error: batch.error }, batch.status ?? 400);
    const items = batch.items!;

    return await runBatch(
      c,
      { source, host, collection: '(multi)', model: '(multi)', items, action: 'DELETE', label: '刪除' },
      async (item, i) => {
        const id = typeof item === 'string'
          ? item
          : (item && typeof item === 'object' && !Array.isArray(item)
            ? (item as Record<string, unknown>).id
            : undefined);
        if (typeof id !== 'string' || !isValidCompositeId(id)) {
          return { id: id === undefined ? `(第 ${i + 1} 筆)` : String(id), error: `無效的 composite ID` };
        }
        try {
          const ok = await access.delete(id);
          if (ok) return { id };
          return { id, error: '記錄不存在' };
        } catch (err) {
          return { id, error: `刪除失敗: ${errMsg(err)}` };
        }
      },
    );
  } catch (err) {
    return c.json({ success: false, error: `刪除失敗: ${errMsg(err)}` }, 500);
  }
}

// ──────────────────────────────────────────
// 批次操作（PUT/PATCH/DELETE /:collection/:model）
// ──────────────────────────────────────────

/** PUT /:collection/:model — 批次整筆更新（upsert），body 為 JSON 陣列 */
export async function handleBatchUpdate(c: any, opts?: CrudHandlerOptions) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const batch = await readBatch(c);
    if (batch.error) return c.json({ success: false, error: batch.error }, batch.status ?? 400);
    const items = batch.items!;

    return await runBatch(
      c,
      { source, host, collection, model, items, action: 'UPDATE', label: '更新' },
      async (item, i) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return { id: `(第 ${i + 1} 筆)`, error: '每一筆必須是 JSON 物件' };
        }
        const rec = item as Record<string, unknown>;
        const id = rec.id;
        const bad = validateRouteId(id, collection, model);
        if (bad) {
          return { id: id === undefined ? `(第 ${i + 1} 筆)` : bad.id, error: bad.error };
        }
        try {
          const record = await access.update(collection, id as string, rec);
          return { id: record.id };
        } catch (err) {
          return { id: id as string, error: `更新失敗: ${errMsg(err)}` };
        }
      },
    );
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${errMsg(err)}` },
      500,
    );
  }
}

/** PATCH /:collection/:model — 批次部分更新，body 為 JSON 陣列（每筆含 id + 欲更新欄位） */
export async function handleBatchPatch(c: any, opts?: CrudHandlerOptions) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const batch = await readBatch(c);
    if (batch.error) return c.json({ success: false, error: batch.error }, batch.status ?? 400);
    const items = batch.items!;

    return await runBatch(
      c,
      { source, host, collection, model, items, action: 'PATCH', label: '部分更新' },
      async (item, i) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return { id: `(第 ${i + 1} 筆)`, error: '每一筆必須是 JSON 物件' };
        }
        const rec = item as Record<string, unknown>;
        const id = rec.id;
        const bad = validateRouteId(id, collection, model);
        if (bad) {
          return { id: id === undefined ? `(第 ${i + 1} 筆)` : bad.id, error: bad.error };
        }
        // id 為定位鍵，其餘欄位才是要 patch 的內容
        const fields = { ...rec };
        delete fields.id;
        try {
          const record = await access.patch(collection, id as string, fields);
          if (record) return { id: record.id };
          return { id: id as string, error: '找不到資料或更新失敗' };
        } catch (err) {
          return { id: id as string, error: `更新失敗: ${errMsg(err)}` };
        }
      },
    );
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${errMsg(err)}` },
      500,
    );
  }
}

/** DELETE /:collection/:model — 批次刪除，body 為 id 陣列（或含 id 之物件陣列） */
export async function handleBatchDelete(c: any, opts?: CrudHandlerOptions) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const target = resolveAccess(c, opts);
    if ('error' in target) return c.json({ success: false, error: target.error }, target.status);
    const { access, source, host } = target;

    const batch = await readBatch(c);
    if (batch.error) return c.json({ success: false, error: batch.error }, batch.status ?? 400);
    const items = batch.items!;

    return await runBatch(
      c,
      { source, host, collection, model, items, action: 'DELETE', label: '刪除' },
      async (item, i) => {
        const id = typeof item === 'string'
          ? item
          : (item && typeof item === 'object' && !Array.isArray(item)
            ? (item as Record<string, unknown>).id
            : undefined);
        const bad = validateRouteId(id, collection, model);
        if (bad) {
          return { id: id === undefined ? `(第 ${i + 1} 筆)` : bad.id, error: bad.error };
        }
        try {
          const ok = await access.delete(id as string);
          if (ok) return { id: id as string };
          return { id: id as string, error: '記錄不存在' };
        } catch (err) {
          return { id: id as string, error: `刪除失敗: ${errMsg(err)}` };
        }
      },
    );
  } catch (err) {
    return c.json(
      { success: false, error: `刪除失敗: ${errMsg(err)}` },
      500,
    );
  }
}
