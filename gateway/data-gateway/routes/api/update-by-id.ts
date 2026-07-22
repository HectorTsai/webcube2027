/**
 * PUT /api/:id{[\\w]+:[\\w]+:[\\w\\-]+}
 * Update a single record by composite ID.
 *
 * ID format: collection:model:nanoid
 * The collection and model are parsed from the ID — no need to specify in URL.
 */

import { dataPool } from '@dui/database';

export const PUT = async (c: any) => {
  try {
    const id = c.req.param('id');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const collection = id.split(':')[0];
    const body = await c.req.json();

    // 若 body 有 id，必須與路由 id 一致
    if (body.id !== undefined && body.id !== id) {
      return c.json(
        { success: false, error: `body 的 id "${body.id}" 與路由 id "${id}" 不一致` },
        400,
      );
    }

    const result = await dataPool.upsert(collection, { ...body, id });

    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    } else {
      return c.json({ success: false, error: result.error || '更新失敗' }, 400);
    }
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};

function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}
