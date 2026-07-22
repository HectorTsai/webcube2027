import { createGateway } from '@dui/framework';
import { dataPool } from '@dui/database';
import { info, error } from '@dui/util';

// ── 1. Gateway 啟動與基礎設定 ──────────────────────
// createGateway 內部已自動呼叫 loadRoutes() 載入 routes/ 下所有路由與 middleware
const gw = await createGateway({
  name: 'data-gateway',
  port: Number(Deno.env.get('DATA_GATEWAY_PORT')) || 8002,
  dirname: import.meta.dirname!,
});

// 提供 L1 reference 給資料庫池
dataPool.setConfigStore(gw.l1);

const app = gw.app;

// ── 2. 全域獨立/系統路由 (不走檔案路由者) ──────────

// Logout 路由
app.get('/logout', (c) => {
  c.header('Set-Cookie', 'jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  const AUTH_GATEWAY_URL = 'http://localhost:8003';
  return c.redirect(`${AUTH_GATEWAY_URL}/login`);
});

// Health check
app.get('/health', async (c) => {
  const l1Ok = dataPool.config !== undefined && dataPool.config !== null;
  const l2Ok = dataPool.System !== undefined && dataPool.System !== null;
  const allOk = l1Ok && l2Ok;
  return c.json({
    status: allOk ? 'ok' : 'degraded',
    service: 'data-gateway',
    l1: l1Ok ? 'connected' : 'disconnected',
    l2: l2Ok ? 'connected' : 'disconnected',
  });
});

// ── 3. Startup 資料庫初始化檢查 ────────────────────

await info('DataGateway', `Starting on port ${gw.port}`);

const connStr = await dataPool.config?.get('l2_connection');
if (connStr) {
  await dataPool.initL2();
  if (dataPool.System) {
    await info('DataGateway', 'L2 已就緒，完整啟動');
  } else {
    await error('DataGateway', 'L2 連線失敗，請檢查設定');
  }
} else {
  await info('DataGateway', '尚未安裝，請前往 /setup');
}

gw.start();