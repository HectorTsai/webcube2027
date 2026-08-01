import { createGateway } from '@dui/framework';
import { info } from '@dui/util';
import { initKeys } from './utils/keys.ts';
import { initAuthConfig, getConfig } from './utils/config.ts';

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
} else {
  await info('AuthGateway', '尚未安裝，請前往 /setup');
}

// ── Startup ──

gw.start();
