import { createGateway } from '@dui/framework';
import { info } from '@dui/util';
import { initKeys } from './utils/keys.ts';
import { setL1 } from './utils/l1.ts';

// ── Gateway bootstrap (L1, crypto, file routes, Hono) ──

const gw = await createGateway({
  name: 'auth-gateway',
  port: Number(Deno.env.get('AUTH_GATEWAY_PORT')) || 8081,
  dirname: import.meta.dirname!,
});

// 註冊 L1 實例供 middleware / handler 存取
setL1(gw.l1);

// ── Ed25519 金鑰初始化 ──

await initKeys(gw.l1);
await info('AuthGateway', 'JWT Ed25519 key pair ready');

// ── 安裝檢查 ──

const dataGatewayUrl = await gw.l1.get('data_gateway_url');
if (dataGatewayUrl) {
  await info('AuthGateway', `data-gateway: ${dataGatewayUrl}`);
} else {
  await info('AuthGateway', '尚未安裝，請前往 /setup');
}

// ── Startup ──

gw.start();
