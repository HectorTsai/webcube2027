import { Hono } from '@dui/framework';
import { createFileRouter } from '@dui/framework/file-router';
import { 創建安裝檢查 } from '@dui/framework/setup-guard';
import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';
import { middleware as apiAuthMiddleware } from './routes/api/_middleware.ts';
import { GET as listCollection } from './routes/api/list-collection.ts';
import { GET as listModel } from './routes/api/list-model.ts';
import { POST as createRecord } from './routes/api/create.ts';
import { GET as getById } from './routes/api/get-by-id.ts';
import { PUT as updateById } from './routes/api/update-by-id.ts';
import { DELETE as deleteById } from './routes/api/delete-by-id.ts';

const app = new Hono();

// ── 安裝狀態 ──
let 已安裝 = false;

// ── 安裝檢查 Middleware ──
app.use('*', 創建安裝檢查(() => 已安裝, ['/inner-api/']));

// ── 安裝 API ──
app.post('/api/setup', async (c) => {
  try {
    const body = await c.req.json();
    const { 管理員帳號, 管理員密碼, l2 } = body;

    if (!管理員帳號 || !管理員密碼) {
      return c.json({ success: false, error: '請填寫管理員帳號與密碼' }, 400);
    }

    // SQLite：只取檔名，放到共用 gateway/data/ 下
    if (l2?.type === 'sqlite' && l2?.filePath) {
      l2.filePath = `${import.meta.dirname}/../data/${l2.filePath.split('/').pop() || 'l2.db'}`;
    }

    // 儲存 L2 連線資訊到 L1（加密）
    if (l2) {
      const { encrypt } = await import('@dui/util');
      const encrypted = await encrypt(JSON.stringify(l2));
      await dataPool.config?.set('l2_connection', encrypted);
    }

    // 初始化 L2
    await dataPool.initL2();
    const system = dataPool.System;
    if (!system) {
      return c.json({ success: false, error: 'L2 資料庫連線失敗' }, 500);
    }
    await system.initialize('管理員');

    // 建立管理員
    const bcrypt = (await import('bcryptjs')) as any;
    const 密碼雜湊 = await bcrypt.default.hash(管理員密碼, 10);
    await dataPool.upsert('管理員', {
      id: '管理員:管理員:admin',
      帳號: 管理員帳號,
      密碼雜湊,
      角色: 'superadmin',
    });

    已安裝 = true;
    await info('DataGateway', '安裝完成');

    return c.json({ success: true });
  } catch (err) {
    return c.json(
      { success: false, error: `安裝失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
});

// ── Inner API（供 auth-gateway 內部調用） ──

const innerApi = new Hono();

innerApi.post('/auth/verify-user', async (c) => {
  try {
    const { 帳號, 密碼 } = await c.req.json();
    const bcrypt = (await import('bcryptjs')) as any;
    const users = await dataPool.queryByField<any>('管理員', { field: '帳號', value: 帳號 }, '管理員');
    const user = users[0];
    if (!user) return c.json({ success: false, error: '帳號或密碼錯誤' });
    const match = await bcrypt.default.compare(密碼, user.密碼雜湊);
    if (!match) return c.json({ success: false, error: '帳號或密碼錯誤' });
    return c.json({
      success: true,
      data: { id: user.id, 帳號: user.帳號, 角色: user.角色 ?? 'admin' },
    });
  } catch (err) {
    return c.json(
      { success: false, error: `驗證失敗: ${err instanceof Error ? err.message : String(err)}` },
      500,
    );
  }
});

app.route('/inner-api', innerApi);

// ── File-based routes ────────────────────────────

const fileRoutes = await createFileRouter({
  dirPath: `${import.meta.dirname}/routes`,
});
app.route('/', fileRoutes);

// ── Data API (manual routes — collection/model structure) ──
// All data API routes require JWT authentication

// GET /api/:collection → list model types in collection
app.get('/api/:collection{[^:/]+}', apiAuthMiddleware, listCollection);

// GET /api/:collection/:model → list records of a model type
app.get('/api/:collection{[^:/]+}/:model{[^:/]+}', apiAuthMiddleware, listModel);

// POST /api/:collection/:model → create new record (validates id if present)
app.post('/api/:collection{[^:/]+}/:model{[^:/]+}', apiAuthMiddleware, createRecord);

// GET/PUT/DELETE /api/:id → single record operations by composite ID
// ID format: collection:model:nanoid (e.g. 圖片:標籤:abc123)
app.get('/api/:id{[^:]+:[^:]+:[^:]+}', apiAuthMiddleware, getById);
app.put('/api/:id{[^:]+:[^:]+:[^:]+}', apiAuthMiddleware, updateById);
app.delete('/api/:id{[^:]+:[^:]+:[^:]+}', apiAuthMiddleware, deleteById);

// ── Logout ────────────────────────────────────────

app.get('/logout', (c) => {
  c.header('Set-Cookie', 'jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  const AUTH_GATEWAY_URL = 'http://localhost:8003';
  return c.redirect(`${AUTH_GATEWAY_URL}/login`);
});

// ── Health check ──────────────────────────────────

app.get('/health', async (c) => {
  // 檢查 L1
  const l1Ok = dataPool.config !== undefined && dataPool.config !== null;
  // 檢查 L2
  const l2Ok = dataPool.System !== undefined && dataPool.System !== null;
  const allOk = l1Ok && l2Ok;
  return c.json({
    status: allOk ? 'ok' : 'degraded',
    service: 'data-gateway',
    l1: l1Ok ? 'connected' : 'disconnected',
    l2: l2Ok ? 'connected' : 'disconnected',
  });
});

// ── Startup ───────────────────────────────────────

const PORT = Number(Deno.env.get('DATA_GATEWAY_PORT')) || 8002;

await info('DataGateway', `Starting on port ${PORT}`);

await dataPool.initL1(`${import.meta.dirname}/../data`);
await info('DataGateway', 'L1 初始化完成');

// 檢查 L2 是否已設定
const connStr = await dataPool.config?.get('l2_connection');
if (connStr) {
  await dataPool.initL2();
  if (dataPool.System) {
    已安裝 = true;
    await info('DataGateway', 'L2 已就緒，完整啟動');
  } else {
    await error('DataGateway', 'L2 連線失敗，請檢查設定');
  }
} else {
  await info('DataGateway', '尚未安裝，請前往 /setup');
}

Deno.serve({ port: PORT }, app.fetch);
