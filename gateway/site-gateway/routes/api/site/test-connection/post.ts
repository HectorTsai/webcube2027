/**
 * POST /api/site/test-connection — 測試 L3 資料庫連線
 *
 * 透過 data-gateway L3 API 測試指定 tenant 的 L3 連線是否正常。
 */

import type { Context } from 'hono';
import { getDataGatewayUrl, getDataGatewayApiKey } from '../../../../utils/config.ts';

export async function POST(c: Context) {
  try {
    const { domain, l3 } = await c.req.json();

    if (!domain || !l3) {
      return c.json({ success: false, error: '請提供 domain 與 L3 設定' }, 400);
    }

    const dataGwUrl = await getDataGatewayUrl();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = await getDataGatewayApiKey();
    if (apiKey) headers['X-API-Key'] = apiKey;

    const res = await fetch(`${dataGwUrl}/api/l3/test-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenant: domain, config: l3 }),
    });
    const result = await res.json();

    return c.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `連線測試失敗：${msg}` }, 500);
  }
}