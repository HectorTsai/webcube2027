import { createGateway } from '@dui/framework';
import { info } from '@dui/util';
import { initKeys } from './utils/keys.ts';

// ── Gateway bootstrap (L1, crypto, file routes, Hono) ──

const gw = await createGateway({
  name: 'auth-gateway',
  port: Number(Deno.env.get('AUTH_GATEWAY_PORT')) || 8003,
  dirname: import.meta.dirname!,
});

// ── Ed25519 金鑰初始化 ──

await initKeys(gw.l1);
await info('AuthGateway', 'JWT Ed25519 key pair ready');

// ── Startup ──

gw.start();
