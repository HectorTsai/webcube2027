/**
 * GET /api/sites — 列出所有網站
 *
 * 透過 data-gateway L2 API 查詢 L2 中的網站資訊。
 */

import type { Context } from 'hono';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../utils/config.ts';

export async function GET(c: Context) {
  try {
    const dataGwUrl = await getDataGatewayUrl();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = await getDataGatewayApiKey();
    if (apiKey) headers['X-API-Key'] = apiKey;

    // 從 L2 查詢所有網站資訊
    const res = await fetch(`${dataGwUrl}/api/l2/_collection_/網站資訊`, {
      method: 'GET',
      headers,
    });
    const result = await res.json();

    if (!result.success) {
      return c.json({ success: false, error: result.error || '查詢失敗' }, 500);
    }

    return c.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `查詢失敗：${msg}` }, 500);
  }
}