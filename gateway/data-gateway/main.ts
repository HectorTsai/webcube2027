import { createGateway } from '@dui/framework';
import { info, error } from '@dui/util';
import { setAuthGatewayUrl } from '@dui/util/jwt';
import { initConfig, getConfig } from './services/config.ts';
import { initL1 } from './services/l1-data.ts';
import { DbManager, setDbManager } from './services/db-manager.ts';

// ── 1. Gateway 啟動與基礎設定 ──────────────────────
const gw = await createGateway({
  name: 'data-gateway',
  port: Number(Deno.env.get('DATA_GATEWAY_PORT')) || 8002,
  dirname: import.meta.dirname!,
});

// ── 2. ConfigStore (persistent JSON KV) ──────────────
const config = await initConfig(gw.dataDir);

// ── 3. JWT public key source ─────────────────────────
const authGwUrl = await config.get('auth_gateway_url');
if (authGwUrl) {
  setAuthGatewayUrl(authGwUrl);
}

// ── 4. L1 sqlite seed (bootstrap data) ──────────────
await initL1(gw.dataDir);

// ── 5. Database Manager (L2/L3 lifecycle) ────────────
const dbm = new DbManager(config);
setDbManager(dbm);

// ── 6. L2 SYSTEM (if installed) ─────────────────────
const connStr = await config.get('l2_connection');
if (connStr) {
  await dbm.initL2();
  if (dbm.System) {
    await info('DataGateway', 'L2 已就緒，完整啟動');
  } else {
    await error('DataGateway', 'L2 連線失敗，請檢查設定');
  }
} else {
  await info('DataGateway', '尚未安裝，請前往 /setup');
}

// ── 7. Logout route (獨立路由，不走檔案路由) ──────────
gw.app.get('/logout', async (c) => {
  c.header('Set-Cookie', 'jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

  let authUrl: string | null = null;
  try {
    authUrl = await config.get('auth_gateway_url');
  } catch { /* config not ready */ }
  if (!authUrl) authUrl = Deno.env.get('AUTH_GATEWAY_URL') ?? null;
  if (!authUrl) {
    return c.text('auth-gateway URL 尚未設定。請先完成安裝或設定 AUTH_GATEWAY_URL 環境變數。', 500);
  }
  return c.redirect(`${authUrl}/login`);
});

// ── Process Signal Handlers ──────────────────────────
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  Deno.addSignalListener(sig, () => {
    dbm.shutdownAll().finally(() => Deno.exit(0));
  });
}

// ── 8. Startup ──────────────────────────────────────
await info('DataGateway', `Starting on port ${gw.port}`);
gw.start();