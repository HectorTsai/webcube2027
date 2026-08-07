/**
 * GET /api/health
 * 健康檢查 — 使用 @dui/framework 的 createHealthHandler 產生統一回應格式。
 *
 * 代理至 data-gateway 的 /api/health，同時回傳本地 account_pool 狀態。
 * data-gateway URL 從 L1 動態讀取，不硬編碼。
 */
import { createHealthHandler } from '@dui/framework';
import { getConfig } from '../../../utils/config.ts';
import { accountPool } from '../../../services/account-pool.ts';

/** Gateway 根目錄（用於讀取 deno.json 版本號） */
const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''));

async function getDataGatewayUrl(): Promise<string | null> {
  try {
    const config = getConfig();
    const stored = await config.get('data_gateway_url');
    if (stored) return stored;
  } catch {
    // L1 尚未就緒
  }
  return Deno.env.get('DATA_GATEWAY_URL') ?? null;
}

export const GET = createHealthHandler(ROOT, 'auth-gateway', async () => {
  // AccountPool 狀態
  let accountPoolStatus: Record<string, unknown> = { status: null, frozen_count: 0, items: [] };
  try {
    const status = accountPool.getStatus();
    const items = accountPool.getItemsOverview();
    const frozenCount = accountPool.getFrozenCount();
    accountPoolStatus = { status, frozen_count: frozenCount, items };
  } catch {
    // pool 尚未初始化
  }

  const dataGwUrl = await getDataGatewayUrl();

  // data_gateway 子物件（與 site-gateway 格式一致）
  let dataGateway: Record<string, unknown>;

  if (!dataGwUrl) {
    dataGateway = { configured: false, reachable: false };
    return {
      status: 'degraded',
      message: 'data-gateway URL 尚未設定。請完成安裝或設定 DATA_GATEWAY_URL 環境變數。',
      data_gateway_url: null,
      data_gateway: dataGateway,
      account_pool: accountPoolStatus,
    };
  }

  try {
    const r = await fetch(`${dataGwUrl}/api/health`);
    const data: Record<string, unknown> = await r.json();
    dataGateway = {
      configured: true,
      reachable: true,
      status: data.status,
      service: data.service,
      version: data.version,
      l1: data.l1,
      l2: data.l2,
      l3: data.l3,
      gateways: data.gateways,
    };
    return {
      // 注意：不可展開 data（...data），否則會覆蓋本 gateway 的 service/version/uptime。
      // 也不回傳 data-gateway 的 adapterPool 狀態（pool）— auth 只需負責自己的 account_pool。
      status: data.status === 'ok' ? 'ok' : 'degraded',
      l1: data.l1,
      l2: data.l2,
      l3: data.l3,
      gateways: data.gateways,
      data_gateway_url: dataGwUrl,
      data_gateway: dataGateway,
      account_pool: accountPoolStatus,
    };
  } catch {
    dataGateway = { configured: true, reachable: false };
    return {
      status: 'error',
      data_gateway_url: dataGwUrl,
      data_gateway: dataGateway,
      l1: 'disconnected',
      l2: 'disconnected',
      account_pool: accountPoolStatus,
    };
  }
});