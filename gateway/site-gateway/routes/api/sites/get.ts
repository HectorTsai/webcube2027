/**
 * GET /api/sites — 列出所有網站（租戶）
 *
 * 透過 data-gateway L2 API 列出 L2 `網站資訊` collection 的所有記錄。
 * 響應結果同時回傳 SitePool 快取狀態，供管理介面參考。
 */

import type { Context } from 'hono';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../utils/config.ts';
import { sitePool } from '../../../services/site-pool.ts';

export async function GET(c: Context) {
  try {
    const dataGwUrl = await getDataGatewayUrl();
    const apiKey = await getDataGatewayApiKey();
    if (!dataGwUrl || !apiKey) {
      return c.json({ success: false, error: 'data-gateway 尚未就緒' }, 502);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    };

    // 列出 L2 網站資訊 collection 的所有記錄
    const res = await fetch(`${dataGwUrl}/api/l2/網站資訊/網站資訊`, {
      method: 'GET',
      headers,
    });
    const result = await res.json();

    if (!result.success) {
      return c.json({ success: false, error: result.error || '查詢失敗' }, 500);
    }

    // 附加 SitePool 狀態
    let poolStatus: Record<string, unknown> = {};
    try {
      poolStatus = {
        status: sitePool.getStatus(),
        items: sitePool.getItemsOverview(),
      };
    } catch {
      // pool 尚未初始化
    }

    return c.json({ ...result, site_pool: poolStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `查詢失敗：${msg}` }, 500);
  }
}
