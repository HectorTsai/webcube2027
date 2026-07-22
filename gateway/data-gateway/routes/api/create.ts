/**
 * POST /api/:collection/:model
 * Create a new record in a collection.
 *
 * URL params:
 *   - collection: Collection (table) name
 *   - model: Model type (2nd segment of composite ID)
 *
 * Body:
 *   - Arbitrary JSON data
 *   - Optional `id` field — if provided, must match collection:model:nanoid format
 *
 * Validation:
 *   - If body contains `id`, verifies collection and model match URL params
 *   - If no `id`, auto-generates composite ID as collection:model:nanoid
 */

import { dataPool } from '@dui/database';

export const POST = async (c: any) => {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const body = await c.req.json();

    // ID 格式驗證：若提供 id，檢查是否符合(collection:model:nanoid)格式 且與路由參數一致
    if (body.id !== undefined) {
      if (typeof body.id !== 'string') {
        return c.json({ success: false, error: 'id 必須是字串' }, 400);
      }
      const parts = body.id.split(':');
      if (parts.length !== 3) {
        return c.json({ success: false, error: 'id 格式必須為 collection:model:nanoid' }, 400);
      }
      if (parts[0] !== collection) {
        return c.json(
          { success: false, error: `id 的 collection 部分 "${parts[0]}" 不符合路由參數 "${collection}"` },
          400,
        );
      }
      if (parts[1] !== model) {
        return c.json(
          { success: false, error: `id 的 model 部分 "${parts[1]}" 不符合路由參數 "${model}"` },
          400,
        );
      }
    }

    const result = await dataPool.upsert(collection, body);

    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    } else {
      return c.json({ success: false, error: result.error || '新增失敗' }, 400);
    }
  } catch (err) {
    return c.json(
      { success: false, error: `新增失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};
