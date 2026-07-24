/**
 * GET /health
 * 健康檢查（代理至 data-gateway 的 /health）
 *
 * data-gateway URL 從 L1 動態讀取，不硬編碼。
 */

import type { Context } from 'hono';
import { getL1 } from '../../utils/l1.ts';

async function getDataGatewayUrl(): Promise<string | null> {
  try {
    const l1 = getL1();
    const stored = await l1.get('data_gateway_url');
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
    const r = await fetch(`${dataGwUrl}/health`);
    const data = await r.json();
    return c.json(data);
  } catch {
    return c.json({
      status: 'error',
      service: 'auth-gateway',
      l1: 'disconnected',
      l2: 'disconnected',
    });
  }
}
