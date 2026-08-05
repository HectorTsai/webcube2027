import { createGateway } from '@dui/framework';
import { info, error } from '@dui/util';
import { initConfig, getConfig } from './services/config.ts';
import { initL1 } from './services/l1-data.ts';
import { getDbManager, setDbManager, DbManager } from './services/db-manager.ts';
import { initAudit } from './services/audit.ts';

// ── 1. Gateway 啟動與基礎設定 ──────────────────────
const gw = await createGateway({
  name: 'data-gateway',
  port: Number(Deno.env.get('DATA_GATEWAY_PORT')) || 8002,
  dirname: import.meta.dirname!,
});

// ── 2. ConfigStore (persistent JSON KV) ──────────────
const config = await initConfig(gw.dataDir);

// ── 3. L1 sqlite seed (bootstrap data) ──────────────
await initL1(gw.dataDir);

// ── 4. Database Manager (L2/L3 lifecycle) ────────────
const dbm = new DbManager(config);
setDbManager(dbm);

// 初始化審計日誌（獨立 audit.db）
await initAudit(gw.dataDir);

// ── 5. L2 SYSTEM (if installed) ─────────────────────
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

// ── 6. Process Signal Handlers ──────────────────────
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  Deno.addSignalListener(sig, () => {
    dbm.shutdownAll().finally(() => Deno.exit(0));
  });
}

// ── 7. Startup ──────────────────────────────────────
await info('DataGateway', `Starting on port ${gw.port}`);
gw.start();