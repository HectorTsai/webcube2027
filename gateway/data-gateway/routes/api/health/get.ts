/**
 * GET /api/health
 * Health check — returns L1/L2/L3 status.
 */
import type { Context } from 'hono';
import { dataPool } from '@dui/database';
import { decrypt } from '@dui/util';
import type { 網站資訊介面 } from '../../../database/models/網站資訊介面.ts';

export const GET = async (c: any) => {
  const l1Ok = dataPool.config !== undefined && dataPool.config !== null;
  const l2Ok = dataPool.System !== undefined && dataPool.System !== null;
  const allOk = l1Ok && l2Ok;

  // auth-gateway URL（供前端登入按鈕使用）
  let authGatewayUrl = '';
  try {
    const stored = await dataPool.config?.get('auth_gateway_url');
    if (stored) authGatewayUrl = stored;
  } catch { /* ignore */ }

  // L3 — 查詢 網站資訊 collection，取第一個有 L3 設定的網站測試連線
  let l3 = '未設定';
  if (l2Ok) {
    try {
      // 列出所有 網站資訊 記錄（防禦性解構，相容 adapter 直回陣列或 QueryResult）
      const res = await dataPool.System!.list('網站資訊', undefined, { limit: 1 });
      const records = (res as any)?.data || (Array.isArray(res) ? res : []);
      if (records.length > 0) {
        const site = records[0] as unknown as 網站資訊介面;
        if (site.資料庫 && site.網址) {
          const decrypted = await decrypt(site.資料庫);
          const connInfo = JSON.parse(decrypted);
          const dbType = connInfo?.type || 'unknown';

          // 清理 hostname（防止 URL 前綴造成 key 匹配失敗）
          let host = site.網址;
          try {
            host = new URL(
              site.網址.startsWith('http') ? site.網址 : `http://${site.網址}`,
            ).hostname;
          } catch {
            // 保留原始字串作為備用
          }

          await dataPool.initL3(host);
          if (dataPool.has(host)) {
            l3 = `${dbType} ✓ 已就緒`;
          } else {
            l3 = `${dbType} ✗ 連線失敗`;
          }
        }
      }
    } catch {
      l3 = '未設定';
    }
  }

  return c.json({
    status: allOk ? 'ok' : 'degraded',
    service: 'data-gateway',
    l1: l1Ok ? 'connected' : 'disconnected',
    l2: l2Ok ? 'connected' : 'disconnected',
    l3,
    auth_gateway_url: authGatewayUrl || undefined,
  });
};
