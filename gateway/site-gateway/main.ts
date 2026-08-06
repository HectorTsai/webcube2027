import { createGateway } from '@dui/framework';
import { info } from '@dui/util';
import { setAuthGatewayUrl } from '@dui/util/jwt';
import { initSiteConfig } from './utils/config.ts';

// ── 1. Gateway 啟動與基礎設定 ──────────────────────

const gw = await createGateway({
  name: 'site-gateway',
  port: Number(Deno.env.get('SITE_GATEWAY_PORT')) || 8004,
  dirname: import.meta.dirname!,
});

// ── 2. ConfigStore (persistent JSON KV) ──────────────

const config = await initSiteConfig(gw.dataDir);

// ── 3. 安裝檢查 ────────────────────────────────────

const authGwUrl = await config.get('auth_gateway_url');
const dataGwUrl = await config.get('data_gateway_url');
if (authGwUrl && dataGwUrl) {
  await info('SiteGateway', `auth-gateway: ${authGwUrl}`);
  await info('SiteGateway', `data-gateway: ${dataGwUrl}`);
  // 設定 auth-gateway URL，讓 @dui/util 的 verifyToken 可取得 Ed25519 公鑰
  setAuthGatewayUrl(String(authGwUrl).replace(/\/+$/, ''));
} else {
  await info('SiteGateway', '尚未安裝，請前往 /setup');
}

// ── 4. Startup ──────────────────────────────────────

await info('SiteGateway', `Starting on port ${gw.port}`);
gw.start();