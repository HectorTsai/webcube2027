/**
 * GET /api/:collection — also handles GET /api/:id (composite ID)
 *
 * 依參數格式自動分流：
 *   - 含 `:` → 視為 composite ID（collection:model:nanoid），取得單筆記錄
 *   - 不含 `:` → 視為 collection 名稱，列出其下所有 model type 及記錄數量
 */

import { dataPool } from '@dui/database';

/** 驗證 collection:model:nanoid 格式 */
function isValidCompositeId(id: string): boolean {
  const parts = id.split(':');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}

export const GET = async (c: any) => {
  try {
    const param = c.req.param('collection');

    // ── composite ID 模式（含 :）→ 取得單筆記錄 ──
    if (param.includes(':')) {
      if (!isValidCompositeId(param)) {
        return c.json({ success: false, error: 'ID 格式必須為 collection:model:nanoid' }, 400);
      }
      const result = await dataPool.getById(param);
      if (result.success && result.data) {
        return c.json({ success: true, data: result.data, source: result.source });
      }
      return c.json({ success: false, error: result.error || '找不到資料' }, 404);
    }

    // ── collection 模式 → 列出 model types ──
    const l2 = dataPool.System;
    if (!l2) {
      return c.json({ success: false, error: 'L2 尚未就緒' }, 503);
    }

    // listModelTypes 是選用方法，若不支援則用 list() + 從 ID 解析 model type
    let modelTypes: string[];
    if (l2.listModelTypes) {
      modelTypes = await l2.listModelTypes(param);
    } else {
      // fallback：撈全部記錄，從 composite ID 提取 model type
      const allRecords = await dataPool.list(param);
      const types = new Set<string>();
      for (const r of (allRecords.data ?? [])) {
        const id = String(r.id || '');
        const parts = id.split(':');
        if (parts.length >= 2) types.add(parts[1]);
      }
      modelTypes = [...types].sort();
    }
    const models = await Promise.all(
      modelTypes.map(async (type: string) => {
        const count = await l2.count(param, type);
        return { type, count };
      }),
    );

    return c.json({
      success: true,
      data: {
        collection: param,
        models,
        totalRecords: models.reduce((sum: number, m: { count: number }) => sum + m.count, 0),
      },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};
