import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';
import { composeId } from '../../../_utils.ts';

export const PUT = async (c: any) => {
  const model = c.req.param('model')!;
  const rawId = c.req.param('id')!;
  const body = await c.req.json();

  await info('DataAPI', `PUT /api/${model}/${rawId}`);

  try {
    body.id = composeId(model, rawId);
    const result = await dataPool.upsert(model, body);
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }
    return c.json({ success: true, data: result.data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `PUT /api/${model}/${rawId} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
};
