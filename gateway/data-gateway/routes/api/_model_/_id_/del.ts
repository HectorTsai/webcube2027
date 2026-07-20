import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';
import { composeId } from '../../../_utils.ts';

export const DELETE = async (c: any) => {
  const model = c.req.param('model')!;
  const rawId = c.req.param('id')!;
  const compositeId = composeId(model, rawId);

  await info('DataAPI', `DELETE /api/${model}/${rawId}`);

  try {
    const result = await dataPool.delete(compositeId);
    if (!result.success) {
      return c.json({ success: false, error: result.error }, result.source === 'L2' ? 403 : 500);
    }
    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `DELETE /api/${model}/${rawId} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
};
