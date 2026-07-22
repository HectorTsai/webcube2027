/**
 * GET /api/:collection
 * List all model types within a collection, with record counts.
 *
 * URL params:
 *   - collection: Collection (table) name
 *
 * Response:
 *   - models: Array of { type, count } for each model type found
 */

import { dataPool } from '@dui/database';

export const GET = async (c: any) => {
  try {
    const collection = c.req.param('collection');

    // 取得該 collection 下所有 model types
    const modelTypes = await dataPool.listModelTypes(collection);

    // 計算每個 model type 的記錄數
    const models = await Promise.all(
      modelTypes.map(async (type) => {
        const count = await dataPool.count(collection, type);
        return { type, count };
      }),
    );

    return c.json({
      success: true,
      data: {
        collection,
        models,
        totalRecords: models.reduce((sum, m) => sum + m.count, 0),
      },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};
