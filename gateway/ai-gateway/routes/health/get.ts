/**
 * GET /health — 健康檢查
 * 檢查 data-gateway 連線狀態
 */

import type { Context } from "hono";
import { health } from "../../services/dataGwClient.ts";

export async function onGet(c: Context) {
  try {
    const h = await health();
    return c.json({
      status: "ok",
      service: "ai-gateway",
      dataGateway: h.status === "ok" ? "connected" : "degraded",
      dataGwL1: h.l1,
      dataGwL2: h.l2,
    });
  } catch (err) {
    return c.json({
      status: "degraded",
      service: "ai-gateway",
      dataGateway: "disconnected",
      error: String(err),
    });
  }
}