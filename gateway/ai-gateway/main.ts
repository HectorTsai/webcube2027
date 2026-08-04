/**
 * ai-gateway — 進入點
 *
 * 使用 @dui/framework createGateway()：
 *   - L1（設定儲存）
 *   - Crypto 金鑰生命週期
 *   - 檔案路由掃描 (routes/)
 *   - HTTP Server
 *
 * 不再自管 auth/資料庫／安裝流程，
 * 分別委託 auth-gateway / data-gateway。
 */

import { createGateway } from '@dui/framework';
import { info, error } from '@dui/util';
import { cors } from 'hono/cors';
import { initAiConfig } from './services/config.ts';

// ── 建立 Gateway 實體 ──
const gw = await createGateway({
  name: 'ai-gateway',
  dirname: import.meta.dirname!,
  port: Number(Deno.env.get('AI_GATEWAY_PORT') || 8003),
});

// ── ConfigStore (persistent JSON KV) ──
const config = await initAiConfig(gw.dataDir);

// ── 安裝檢查 ──
const dataGatewayUrl = await config.get('data_gateway_url');
if (dataGatewayUrl) {
  await info('ai-gateway', `data-gateway: ${dataGatewayUrl}`);
} else {
  await info('ai-gateway', 'data-gateway URL 尚未設定（可設定 DATA_GATEWAY_URL 或寫入 config.json 的 data_gateway_url）');
}

// ── CORS ──
gw.app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:8000', 'http://localhost:8001', 'http://localhost:8002', 'http://localhost:8003'],
    credentials: true,
  }),
);

// ── 啟動排程器 ──
const { startScheduler, stopScheduler } = await import('./services/scheduler/index.ts');
await startScheduler();
await info('ai-gateway', '排程器已啟動');

// ── 優雅關閉 ──
globalThis.addEventListener('unload', () => {
  stopScheduler();
});

// ── 啟動 HTTP Server ──
gw.start();
await info('ai-gateway', `已啟動於 port ${Deno.env.get('AI_GATEWAY_PORT') || 8003}`);