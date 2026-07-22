/**
 * GET /api/:id
 * Get a single record by composite ID.
 *
 * ID format: collection:model:nanoid
 * Example: GET /api/%E5%9C%96%E7%89%87:%E6%A8%99%E7%B1%A4:abc123
 */

import { dataPool } from '@dui/database';

export const GET = async (c: any) => {
  try {
    const id = c.req.param('id');

    // 驗證 ID 格式
    if (!isValidCompositeId(id)) {
      return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
    }

    const result = await dataPool.getById(id);

    if (result.success && result.data) {
      return c.json({ success: true, data: result.data, source: result.source });
    } else {
      return c.json({ success: false, error: result.error || '找不到資料' }, 404);
    }
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};

/** 驗證 collection:model:nanoid 格式 */
function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}
