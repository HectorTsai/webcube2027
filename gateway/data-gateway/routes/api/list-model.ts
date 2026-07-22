/**
 * GET /api/:collection/:model
 * List all records of a specific model type within a collection.
 *
 * URL params:
 *   - collection: Collection (table) name
 *   - model: Model type (2nd segment of composite ID)
 *
 * Query params:
 *   - limit (default 50)
 *   - offset (default 0)
 */

import { dataPool } from '@dui/database';

export const GET = async (c: any) => {
  try {
    const collection = c.req.param('collection');
    const model = c.req.param('model');
    const limit = Number(c.req.query('limit') ?? 50);
    const offset = Number(c.req.query('offset') ?? 0);

    const result = await dataPool.list(collection, model, { limit, offset });

    return c.json({
      success: true,
      data: result.data,
      source: result.source,
      pagination: { limit, offset, count: result.data?.length ?? 0 },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `查詢失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
};
