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

// Logout 路由 — 清除 JWT cookie 並導向 auth-gateway 登入頁
app.get('/logout', async (c) => {
  c.header('Set-Cookie', 'jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

  // 從 L1 動態讀取 auth-gateway URL（不硬編碼）
  let authUrl: string | null = null;
  try {
    const storedAuthUrl = await gw.l1.get('auth_gateway_url');
    if (storedAuthUrl) authUrl = storedAuthUrl;
  } catch {
    // L1 尚未就緒
  }
  if (!authUrl) authUrl = Deno.env.get('AUTH_GATEWAY_URL') ?? null;
  if (!authUrl) {
    return c.text('auth-gateway URL 尚未設定。請先完成安裝或設定 AUTH_GATEWAY_URL 環境變數。', 500);
  }
  return c.redirect(`${authUrl}/login`);
});

// Health check — moved to routes/api/health/get.ts

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