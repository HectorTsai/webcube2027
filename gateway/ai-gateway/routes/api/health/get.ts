/**
 * GET /api/health — AI gateway 健康狀態
 */

import type { Context } from 'hono';
import { health } from '../../../services/dataGwClient.ts';

export async function onGet(c: Context) {
  try {
    const dataGwHealth = await health();
    return c.json({
      status: 'ok',
      service: 'ai-gateway',
      dataGateway: dataGwHealth.status === 'ok' ? 'connected' : 'degraded',
      dataGwL1: dataGwHealth.l1,
      dataGwL2: dataGwHealth.l2,
    });
  } catch (err) {
    return c.json({
      status: 'degraded',
      service: 'ai-gateway',
      dataGateway: 'disconnected',
      error: String(err),
    });
  }
}