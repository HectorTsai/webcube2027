import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';
import { composeId } from '../../../_utils.ts';

export const GET = async (c: any) => {
  const model = c.req.param('model')!;
  const rawId = c.req.param('id')!;
  const compositeId = composeId(model, rawId);

  await info('DataAPI', `GET /api/${model}/${rawId}`);

  try {
    const result = await dataPool.getById(compositeId);
    if (!result.success || !result.data) {
      return c.json({ success: false, error: 'Not found' }, 404);
    }
    return c.json({ success: true, data: result.data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `GET /api/${model}/${rawId} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
};
