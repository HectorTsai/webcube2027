/**
 * PATCH /api/:id
 * Partially update specific fields of a record (without read-modify-write cycle).
 *
 * ID format: collection:model:nanoid
 *
 * Body: { "欄位1": "新值", "欄位2": "新值" }
 * 只傳需要修改的欄位即可，未提供的欄位保持不變。
 */

import { dataPool } from '@dui/database';

function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}

export const PATCH = async (c: any) => {
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

    // 不允許透過 PATCH 修改 id
    if (body.id !== undefined) {
      return c.json({ success: false, error: '不允許修改 id' }, 400);
    }

    const result = await dataPool.patch(collection, id, body);

    if (result.success) {
      return c.json({ success: true, data: result.data, source: result.source });
    } else {
      // patch 回傳 null 代表找不到該筆資料
      return c.json({ success: false, error: '找不到資料或更新失敗' }, 404);
    }
  } catch (err) {
    return c.json(
      { success: false, error: `更新失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};
