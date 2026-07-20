import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';

export const GET = async (c: any) => {
  const model = c.req.param('model')!;
  const limit = Number(c.req.query('limit')) || 50;
  const offset = Number(c.req.query('offset')) || 0;
  const field = c.req.query('field');
  const value = c.req.query('value');

  await info('DataAPI', `GET /api/${model} (limit=${limit}, offset=${offset})`);

  try {
    let results: Record<string, unknown>[];

    if (field && value) {
      const sys = dataPool.System;
      if (!sys) {
        return c.json({ success: false, error: 'Database not initialized' }, 500);
      }
      results = await sys.queryByField(model, { field, value });
    } else {
      const result = await dataPool.list<{ id: string }>(model, limit, offset);
      results = (result.data ?? []) as unknown as Record<string, unknown>[];
    }

    return c.json({ success: true, data: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `GET /api/${model} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
};
