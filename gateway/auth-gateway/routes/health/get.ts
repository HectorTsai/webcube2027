/**
 * GET /health
 * 健康檢查（代理至 data-gateway 的 /health）
 */

import type { Context } from 'hono';

const DATA_GATEWAY_URL = Deno.env.get('DATA_GATEWAY_URL') || 'http://localhost:8002';

export async function GET(c: Context) {
  try {
    const r = await fetch(`${DATA_GATEWAY_URL}/health`);
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
