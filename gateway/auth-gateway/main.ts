import { createGateway, syncAllSeeds } from '@dui/framework';
import { info } from '@dui/util';
import { initKeys } from './utils/keys.ts';
import { initAuthConfig, getDataGatewayApiKey } from './utils/config.ts';

// ── Gateway bootstrap (ConfigStore, crypto, file routes, Hono) ──

const gw = await createGateway({
  name: 'auth-gateway',
  port: Number(Deno.env.get('AUTH_GATEWAY_PORT')) || 8001,
  dirname: import.meta.dirname!,
});

// ── ConfigStore (persistent JSON KV) ──

const config = await initAuthConfig(gw.dataDir);

// ── Ed25519 金鑰初始化 ──

await initKeys(config);
await info('AuthGateway', 'JWT Ed25519 key pair ready');

// ── 安裝檢查 ──

const dataGatewayUrl = await config.get('data_gateway_url');
if (dataGatewayUrl) {
  await info('AuthGateway', `data-gateway: ${dataGatewayUrl}`);

  // ── Seed 同步（內容 hash 比對版本，版本不同時自動 PUT 覆寫；非阻斷） ──
  // 失敗時保留舊版本 hash，下次啟動自動重試
  const apiKey = await getDataGatewayApiKey();
  if (apiKey) {
    syncAllSeeds({
      seedsRoot: new URL('./database/seeds/', import.meta.url),
      store: config,
      baseUrl: dataGatewayUrl,
      apiKey,
    }).catch(async (err) => {
      await info('AuthGateway', `Seed 同步失敗（啟動繼續，下次重試）：${err instanceof Error ? err.message : String(err)}`);
    });
  }
} else {
  await info('AuthGateway', '尚未安裝，請前往 /setup');
}

// ── Startup ──

gw.start();
