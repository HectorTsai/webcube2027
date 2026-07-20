import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';

export const POST = async (c: any) => {
  const model = c.req.param('model')!;
  const body = await c.req.json();

  await info('DataAPI', `POST /api/${model}`);

  try {
    const result = await dataPool.upsert(model, body);
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }
    return c.json({ success: true, data: result.data }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `POST /api/${model} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
};
