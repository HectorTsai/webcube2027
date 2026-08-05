/**
 * L1 CRUD handler — 操作 L1 SQLite（bootstrap 資料）
 *
 * 與 utils/crud.ts 同構，但操作 L1 adapter（getL1）。
 * 權限由 middleware 統一檢查，handler 不重複做 JWT 權限判斷。
 *
 * host 概念不適用 L1（無 L3），一律操作 L1。
 */

import { getL1 } from '../services/l1-data.ts';
import { writeAuditLog } from '../services/audit.ts';

function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}

/** 取得 L1 adapter，未初始化時回傳 null */
function l1(): ReturnType<typeof getL1> {
  const adapter = getL1();
  if (!adapter) return null;
  return adapter;
}

/** 從 L1 掃出 collection 下的 model types（解析 composite ID 第二段） */
async function getModelTypes(collection: string): Promise<string[]> {
  const adapter = l1();
  if (!adapter) return [];

  if (typeof adapter.listModelTypes === 'function') {
    try {
      const types = await adapter.listModelTypes(collection);
      if (types?.length) return types;
    } catch {
      // fallback 到掃描
    }
  }

  // 後備：掃描全部記錄解析 model type
  const records = await adapter.list(collection);
  const types = new Set<string>();
  for (const r of records) {
    const segs = (r.id as string)?.split(':');
    if (segs?.length === 3) types.add(segs[1]);
  }
  return Array.from(types);
}

/**
 * GET /:collection
 *
 * 根據 `:collection` 參數自動判斷：
 *   - 含有 `:`  → 當作 composite ID，執行 getById
 *   - 不含 `:`  → 當作 collection 名稱，列出其下的 model types
 */
export async function handleL1Collection(c: any) {
  const param = c.req.param('collection');

  // ── composite ID → getById ──
  if (isValidCompositeId(param)) {
    return handleL1GetById(c);
  }

  const adapter = l1();
  if (!adapter) {
    return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
  }

  try {
    const types = await getModelTypes(param);
    return c.json({ success: true, collection: param, modelTypes: types });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** GET /:collection/:model — 列表 */
export async function handleL1List(c: any) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const adapter = l1();
    if (!adapter) {
      return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
    }

    const limit = Math.min(100, Number(c.req.query('limit') ?? 50));
    const offset = Math.max(0, Number(c.req.query('offset') ?? 0));

    const records = await adapter.list(collection, model, { limit, offset });
    const totalCount = await adapter.count(collection, model).catch(() => records.length);

    return c.json({
      success: true,
      data: records,
      source: 'L1',
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
export async function handleL1Create(c: any) {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const body = await c.req.json();
    const adapter = l1();
    if (!adapter) {
      return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
    }

    // ID 格式驗證（與 L2/L3 一致：collection:model:xxx）
    const id = body.id as string | undefined;
    if (id !== undefined) {
      if (typeof id !== 'string') {
        return c.json({ success: false, error: 'id 必須是字串' }, 400);
      }
      const parts = id.split(':');
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

    // 計算最終 ID（未提供時自動產生）
    const finalId = id || `${collection}:${model}:${crypto.randomUUID().slice(0, 8)}`;

    // 檢查是否已存在（避免覆寫）
    const existing = await adapter.getById(finalId).catch(() => null);
    if (existing) {
      return c.json({ success: false, error: `L1 中已存在記錄：${finalId}` }, 409);
    }

    const record = await adapter.create(collection, finalId, body);
    writeAuditLog({
      操作者: (c.get('gateway_name') as string) || 'unknown',
      動作: 'CREATE',
      層級: 'L1',
      目標: record.id,
      租戶: null,
      變更摘要: `建立 ${collection} ${model}`,
    }).catch(() => {});
    return c.json({ success: true, data: record, source: 'L1' });
  } catch (err) {
    return c.json(
      { success: false, error: `新增失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** GET /:id — 單筆查詢 */
export async function handleL1GetById(c: any) {
  try {
    const id = c.req.param('id') || c.req.param('collection');
    const adapter = l1();
    if (!adapter) {
      return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
    }

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'id 格式必須為 collection:model:nanoid' }, 400);
    }

    const record = await adapter.getById(id);
    if (!record) {
      return c.json({ success: false, error: '記錄不存在' }, 404);
    }
    return c.json({ success: true, data: record, source: 'L1' });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** PUT /:id — 整筆更新 */
export async function handleL1Update(c: any) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const adapter = l1();
    if (!adapter) {
      return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
    }

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'id 格式必須為 collection:model:nanoid' }, 400);
    }

    const collection = id.split(':')[0];
    const record = await adapter.update(collection, id, body);
    writeAuditLog({
      操作者: (c.get('gateway_name') as string) || 'unknown',
      動作: 'UPDATE',
      層級: 'L1',
      目標: id,
      租戶: null,
      變更摘要: `更新 ${collection} ${id}`,
    }).catch(() => {});
    return c.json({ success: true, data: record, source: 'L1' });
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** PATCH /:id — 部分更新 */
export async function handleL1Patch(c: any) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const adapter = l1();
    if (!adapter) {
      return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
    }

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'id 格式必須為 collection:model:nanoid' }, 400);
    }

    const collection = id.split(':')[0];
    const record = await adapter.patch(collection, id, body);
    if (!record) {
      return c.json({ success: false, error: '記錄不存在' }, 404);
    }
    writeAuditLog({
      操作者: (c.get('gateway_name') as string) || 'unknown',
      動作: 'PATCH',
      層級: 'L1',
      目標: id,
      租戶: null,
      變更摘要: `部分更新 ${collection} ${id}`,
    }).catch(() => {});
    return c.json({ success: true, data: record, source: 'L1' });
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}

/** DELETE /:id — 刪除 */
export async function handleL1Delete(c: any) {
  try {
    const id = c.req.param('id');
    const adapter = l1();
    if (!adapter) {
      return c.json({ success: false, error: 'L1 尚未初始化' }, 500);
    }

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'id 格式必須為 collection:model:nanoid' }, 400);
    }

    const ok = await adapter.delete(id);
    if (!ok) {
      return c.json({ success: false, error: '記錄不存在' }, 404);
    }
    const collection = id.split(':')[0];
    writeAuditLog({
      操作者: (c.get('gateway_name') as string) || 'unknown',
      動作: 'DELETE',
      層級: 'L1',
      目標: id,
      租戶: null,
      變更摘要: `刪除 ${collection} ${id}`,
    }).catch(() => {});
    return c.json({ success: true, data: { id } });
  } catch (err) {
    return c.json(
      { success: false, error: `刪除失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
}
