/**
 * DELETE /api/:id{[\\w]+:[\\w]+:[\\w\\-]+}
 * Delete a single record by composite ID.
 *
 * ID format: collection:model:nanoid
 * The collection and model are parsed from the ID.
 */

import { dataPool } from '@dui/database';

export const DELETE = async (c: any) => {
  try {
    const id = c.req.param('id');

    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const result = await dataPool.delete(id);

    if (result.success) {
      return c.json({ success: true, data: result.data });
    } else {
      return c.json({ success: false, error: result.error || '刪除失敗' }, 400);
    }
  } catch (err) {
    return c.json(
      { success: false, error: `刪除失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};

function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}
