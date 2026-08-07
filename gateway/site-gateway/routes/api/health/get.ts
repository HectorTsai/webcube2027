import { createHealthHandler } from '@dui/framework';
import { sitePool } from '../../../services/site-pool.ts';
import { getDataGatewayUrl } from '../../../utils/config.ts';

const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''));

export const GET = createHealthHandler(ROOT, 'site-gateway', async () => {
  const dgUrl = await getDataGatewayUrl();

  // data-gateway 連線狀態（不因 data-gateway 故障而影響 health 主流程）
  let dataGateway: Record<string, unknown> = {
    configured: !!dgUrl,
    reachable: false,
  };
  if (dgUrl) {
    try {
      const r = await fetch(`${dgUrl}/api/health`);
      if (r.ok) {
        const j = await r.json();
        dataGateway = {
          configured: true,
          reachable: true,
          status: j.status,
          service: j.service,
          version: j.version,
        };
      }
    } catch {
      // data-gateway 無法連線
    }
  }

  // SitePool 快取狀態（供管理員 dashboard 檢視）
  let sitePoolStatus: Record<string, unknown> = { status: null, items: [] };
  try {
    sitePoolStatus = {
      status: sitePool.getStatus(),
      items: sitePool.getItemsOverview(),
    };
  } catch {
    // pool 尚未初始化
  }

  // 整體狀態：data-gateway 可連線才算 ok
  const dgOk = dgUrl && dataGateway.reachable;

  return {
    status: dgOk ? 'ok' : 'degraded',
    data_gateway_url: dgUrl,
    data_gateway: dataGateway,
    site_pool: sitePoolStatus,
  };
});
