import { createGateway } from '@dui/framework';
import { dataPool } from '@dui/database';
import { info, error, decrypt } from '@dui/util';
import { extractToken, verifyToken } from './utils/jwt.ts';
import type { 網站資訊介面 } from './database/models/網站資訊介面.ts';

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

// Health check
app.get('/health', async (c) => {
  const l1Ok = dataPool.config !== undefined && dataPool.config !== null;
  const l2Ok = dataPool.System !== undefined && dataPool.System !== null;
  const allOk = l1Ok && l2Ok;

  // L3 — 從 JWT 取得 tenant，查詢 site:config 看有沒有設定 L3 資料庫
  let l3 = '未設定';
  const token = extractToken(c);
  if (token) {
    const payload = await verifyToken(token);
    const tenant = payload?.tenant as string | undefined;
    if (tenant && l2Ok) {
      try {
        // 讀取 site:config:{tenant}
        const siteRecord = await dataPool.System!.getById(`site:config:${tenant}`);
        if (siteRecord) {
          const site = siteRecord as unknown as 網站資訊介面;
          if (site.資料庫) {
            // 解密 L3 連線資訊
            const decrypted = await decrypt(site.資料庫);
            const connInfo = JSON.parse(decrypted);
            const dbType = connInfo?.type || 'unknown';

            // 嘗試建立 L3 連線
            await dataPool.initL3(tenant);
            if (dataPool.has(tenant)) {
              l3 = `${dbType} ✓ 已就緒`;
            } else {
              l3 = `${dbType} ✗ 連線失敗`;
            }
          }
        }
      } catch {
        // site:config 可能不存在（尚未建立網站資訊）
        l3 = '未設定';
      }
    }
  }

  return c.json({
    status: allOk ? 'ok' : 'degraded',
    service: 'data-gateway',
    l1: l1Ok ? 'connected' : 'disconnected',
    l2: l2Ok ? 'connected' : 'disconnected',
    l3,
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