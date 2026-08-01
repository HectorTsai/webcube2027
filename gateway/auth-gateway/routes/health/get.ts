/**
 * GET /health
 * 健康檢查（代理至 data-gateway 的 /api/health）
 *
 * data-gateway URL 從 L1 動態讀取，不硬編碼。
 * 同時回傳 data_gateway_url 供前端頁面動態設定連結。
 */

import type { Context } from 'hono';
import { getConfig } from '../../utils/config.ts';

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

export async function GET(c: Context) {
  const dataGwUrl = await getDataGatewayUrl();

  if (!dataGwUrl) {
    return c.json({
      status: 'degraded',
      service: 'auth-gateway',
      message: 'data-gateway URL 尚未設定。請完成安裝或設定 DATA_GATEWAY_URL 環境變數。',
    });
  }

  try {
    const r = await fetch(`${dataGwUrl}/api/health`);
    const data = await r.json();
    return c.json({ ...data, data_gateway_url: dataGwUrl });
  } catch {
    return c.json({
      status: 'error',
      service: 'auth-gateway',
      data_gateway_url: dataGwUrl,
      l1: 'disconnected',
      l2: 'disconnected',
    });
  }
}
