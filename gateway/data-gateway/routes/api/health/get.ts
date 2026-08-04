/**
 * GET /api/health
 * Health check — returns L1/L2/L3 status.
 */
import type { Context } from 'hono';
import { getConfig } from '../../../services/config.ts';
import { getDbManager } from '../../../services/db-manager.ts';
import { decrypt } from '@dui/util';

/** 網站資訊 記錄的欄位（database/models 已隨 seeds 搬離，改為局部定義） */
interface SiteRecord {
  網址?: string;
  模式?: string;
  設定?: Record<string, string>;
  資料庫?: string;
}

export const GET = async (c: Context) => {
  const l1Ok = true;
  const l2Ok = getDbManager().System !== null;
  const allOk = l1Ok && l2Ok;

  // 已註冊 Gateway 位址（register-gateway 時記錄，供診斷各 gateway 位置）
  let gateways: Record<string, string> | undefined;
  try {
    const stored = await getConfig().get('gateways');
    if (stored) gateways = JSON.parse(stored);
  } catch { /* ignore */ }

  // L3 — 查詢 網站資訊 collection，取第一個網站顯示 L3 狀態（依模式）
  let l3 = '未設定';
  if (l2Ok) {
    try {
      // 列出所有 網站資訊 記錄（防禦性解構，相容 adapter 直回陣列或 QueryResult）
      const res = await getDbManager().System!.list('網站資訊', undefined, { limit: 1 });
      const records = (res as any)?.data || (Array.isArray(res) ? res : []);
      if (records.length > 0) {
        const site = records[0] as unknown as SiteRecord;
        if (site.網址) {
          // 清理 hostname（防止 URL 前綴造成 key 匹配失敗）
          let host = site.網址;
          try {
            host = new URL(
              site.網址.startsWith('http') ? site.網址 : `http://${site.網址}`,
            ).hostname.toLowerCase();
          } catch {
            // 保留原始字串作為備用
          }

          const 設定 = site.設定 || {};

          if (site.模式 === 'REDIRECT') {
            l3 = `REDIRECT → ${設定['redirect_url'] || '未設定'}`;
          } else if (site.模式 === 'MIRROR') {
            const mirrorHost = 設定['mirror_host'] || '未設定';
            await getDbManager().initL3(host);
            if (getDbManager().getL3(host)) {
              l3 = `MIRROR → ${mirrorHost} ✓ 已就緒`;
            } else {
              l3 = `MIRROR → ${mirrorHost} ✗ 連線失敗`;
            }
          } else if (site.資料庫) {
            const decrypted = await decrypt(site.資料庫);
            const connInfo = JSON.parse(decrypted);
            const dbType = connInfo?.type || 'unknown';

            await getDbManager().initL3(host);
            if (getDbManager().getL3(host)) {
              l3 = `${dbType} ✓ 已就緒`;
            } else {
              l3 = `${dbType} ✗ 連線失敗`;
            }
          }
        }
      }
    } catch {
      l3 = '未設定';
    }
  }

  // ── Pool 狀態（AdapterPool：L2 SYSTEM + L3 租戶連線） ──
  let pool = null;
  try {
    pool = getDbManager().getPoolSnapshot();
  } catch {
    pool = null;
  }

  return c.json({
    status: allOk ? 'ok' : 'degraded',
    service: 'data-gateway',
    l1: l1Ok ? 'connected' : 'disconnected',
    l2: l2Ok ? 'connected' : 'disconnected',
    l3,
    gateways,
    pool,
  });
};
