/**
 * GET /api/health
 * Health check — returns standard fields + L1/L2/L3 status + pool snapshot + gateways.
 *
 * 使用 @dui/framework 的 createHealthHandler 產生統一回應格式。
 */
import { createHealthHandler } from '@dui/framework';
import { getConfig } from '../../../services/config.ts';
import { getDbManager } from '../../../services/db-manager.ts';
import { decrypt } from '@dui/util';

/** Gateway 根目錄（用於讀取 deno.json 版本號） */
const ROOT = decodeURIComponent(new URL('../../../', import.meta.url).pathname.replace(/\/$/, ''));

interface SiteRecord {
  網址?: string;
  模式?: string;
  設定?: Record<string, string>;
  資料庫?: string;
}

export const GET = createHealthHandler(ROOT, 'data-gateway', async () => {
  const l1Ok = getDbManager().L1 !== null;
  const l2Ok = getDbManager().System !== null;

  // 已註冊 Gateway 位址
  let gateways: Record<string, string> | undefined;
  try {
    const stored = await getConfig().get('gateways');
    if (stored) gateways = JSON.parse(stored);
  } catch { /* ignore */ }

  // L3 — 查詢 網站資訊 collection 顯示狀態
  let l3 = '未設定';
  if (l2Ok) {
    try {
      const res = await getDbManager().System!.list('網站資訊', undefined, { limit: 1 });
      const records = (res as any)?.data || (Array.isArray(res) ? res : []);
      if (records.length > 0) {
        const site = records[0] as unknown as SiteRecord;
        if (site.網址) {
          let host = site.網址;
          try {
            host = new URL(
              site.網址.startsWith('http') ? site.網址 : `http://${site.網址}`,
            ).hostname.toLowerCase();
          } catch { /* 保留原始字串 */ }

          const 設定 = site.設定 || {};

          if (site.模式 === 'REDIRECT') {
            l3 = `REDIRECT → ${設定['redirect_url'] || '未設定'}`;
          } else if (site.模式 === 'MIRROR') {
            const mirrorHost = 設定['mirror_host'] || '未設定';
            await getDbManager().initL3(host);
            l3 = getDbManager().getL3(host)
              ? `MIRROR → ${mirrorHost} ✓ 已就緒`
              : `MIRROR → ${mirrorHost} ✗ 連線失敗`;
          } else if (site.資料庫) {
            const decrypted = await decrypt(site.資料庫);
            const connInfo = JSON.parse(decrypted);
            const dbType = connInfo?.type || 'unknown';
            await getDbManager().initL3(host);
            l3 = getDbManager().getL3(host)
              ? `${dbType} ✓ 已就緒`
              : `${dbType} ✗ 連線失敗`;
          }
        }
      }
    } catch {
      l3 = '未設定';
    }
  }

  // Pool 快照
  let pool = null;
  try {
    pool = getDbManager().getPoolSnapshot();
  } catch {
    pool = null;
  }

  return {
    status: l1Ok && l2Ok ? 'ok' : 'degraded',
    l1: l1Ok ? 'connected' : 'disconnected',
    l2: l2Ok ? 'connected' : 'disconnected',
    l3,
    gateways,
    pool,
  };
});