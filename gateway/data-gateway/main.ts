import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { dataPool } from '@dui/database/pool';
import { getModel, listModels } from '@dui/database/model-registry';
import { info, error } from '@dui/database/logger';

const app = new Hono();

app.use('/static/*', serveStatic({ root: './' }));

// ── REST API ──────────────────────────────────────────

/** List records for a model */
app.get('/api/:model', async (c) => {
  const model = c.req.param('model');
  const limit = Number(c.req.query('limit')) || 50;
  const offset = Number(c.req.query('offset')) || 0;
  const field = c.req.query('field');
  const value = c.req.query('value');

  await info('DataAPI', `GET /api/${model} (limit=${limit}, offset=${offset})`);

  try {
    let results: Record<string, unknown>[];

    if (field && value) {
      results = await dataPool.queryByField(model, { field, value });
    } else {
      results = await dataPool.list(model, { limit, offset });
    }

    return c.json({ success: true, data: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `GET /api/${model} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
});

/** Get a single record by ID */
app.get('/api/:model/:id', async (c) => {
  const model = c.req.param('model');
  const id = c.req.param('id');

  await info('DataAPI', `GET /api/${model}/${id}`);

  try {
    const record = await dataPool.getById(model, id);
    if (!record) {
      return c.json({ success: false, error: 'Not found' }, 404);
    }
    return c.json({ success: true, data: record });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `GET /api/${model}/${id} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
});

/** Create a record */
app.post('/api/:model', async (c) => {
  const model = c.req.param('model');
  const body = await c.req.json();

  await info('DataAPI', `POST /api/${model}`);

  try {
    const Model = getModel(model);
    if (Model) {
      const instance = new Model(body);
      const result = await dataPool.save(model, instance as Record<string, unknown>);
      return c.json({ success: true, data: result }, 201);
    }

    // No registered model — save raw data
    const result = await dataPool.save(model, body);
    return c.json({ success: true, data: result }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `POST /api/${model} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
});

/** Update/replace a record */
app.put('/api/:model/:id', async (c) => {
  const model = c.req.param('model');
  const id = c.req.param('id');
  const body = await c.req.json();

  await info('DataAPI', `PUT /api/${model}/${id}`);

  try {
    const Model = getModel(model);
    if (Model) {
      const instance = new Model({ ...body, id });
      const result = await dataPool.save(model, instance as Record<string, unknown>);
      return c.json({ success: true, data: result });
    }

    body.id = id;
    const result = await dataPool.save(model, body);
    return c.json({ success: true, data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `PUT /api/${model}/${id} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
});

/** Delete a record */
app.delete('/api/:model/:id', async (c) => {
  const model = c.req.param('model');
  const id = c.req.param('id');

  await info('DataAPI', `DELETE /api/${model}/${id}`);

  try {
    await dataPool.delete(model, id);
    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await error('DataAPI', `DELETE /api/${model}/${id} failed: ${msg}`);
    return c.json({ success: false, error: msg }, 500);
  }
});

/** List registered models */
app.get('/api/models', async (c) => {
  const models = listModels();
  return c.json({ success: true, data: models });
});

// ── Health check ──────────────────────────────────────

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'data-gateway' });
});

// ── Startup ───────────────────────────────────────────

const PORT = Number(Deno.env.get('DATA_GATEWAY_PORT')) || 8002;

await info('DataGateway', `Starting on port ${PORT}`);

// Import seed data if available
try {
  const { loadSeeds } = await import('@dui/database/seed-loader');
  const models = listModels();
  for (const modelName of models) {
    const seeds = await loadSeeds(modelName);
    if (seeds && seeds.length > 0) {
      for (const seed of seeds) {
        await dataPool.save(modelName, seed as Record<string, unknown>);
      }
      await info('DataGateway', `Seeded ${seeds.length} records for ${modelName}`);
    }
  }
} catch {
  // No seeds directory or seed loader — that's fine
}

Deno.serve({ port: PORT }, app.fetch);
