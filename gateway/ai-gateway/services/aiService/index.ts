// AI Service Router — Pool 相關路由

import { Context } from "hono";
import { info, error } from "../../utils/logger.ts";
import { 資料池 } from "../../database/資料池.ts";
import { AIPoolManager } from "./pool.ts";
/**
 * 處理 AI Service 請求（由 main.ts 分發）
 */
export async function 處理AI請求(c: Context): Promise<Response> {
  const path = c.req.path;
  const method = c.req.method;

  // 解析路徑: /api/v1/ai/xxx
  const aiPath = path.replace("/api/v1/ai/", "").replace("/api/v1/ai", "");

  try {
    switch (true) {
      // ── AI Server 列表 ──
      case method === "GET" && aiPath === "servers": {
        const pool = new AIPoolManager(c);
        await pool.觸發Pool載入();
        return c.json({ success: true, data: AIPoolManager.列出Server() });
      }

      // ── AI Pool 自適應恢復（排程呼叫） ──
      case method === "POST" && aiPath === "pool/restore": {
        await AIPoolManager.自適應恢復();
        return c.json({ success: true, data: { message: "Pool 自適應恢復完成" } });
      }

      // ── AI Model 狀態大綱 ──
      case method === "GET" && aiPath === "models": {
        const pool = new AIPoolManager(c);
        await pool.觸發Pool載入();
        return c.json({ success: true, data: AIPoolManager.列出模型狀態() });
      }

      // ── AI Model 細節 ──
      case method === "GET" && aiPath.startsWith("models/"): {
        const modelId = aiPath.replace("models/", "");
        const pool = new AIPoolManager(c);
        await pool.觸發Pool載入();
        const detail = AIPoolManager.取得模型細節(modelId);
        if (!detail) {
          return c.json(
            { success: false, error: { code: "NOT_FOUND", message: "模型不存在" } },
            404,
          );
        }
        return c.json({ success: true, data: detail });
      }

      default:
        return c.json({
          success: false,
          error: { code: "NOT_FOUND", message: `未知的 AI 端點: ${method} ${path}` },
        }, 404);
    }
  } catch (err) {
    await error("AI Service", `請求失敗: ${err}`);
    return c.json({
      success: false,
      error: {
        code: "AI_ERROR",
        message: err instanceof Error ? err.message : "AI 服務錯誤",
      },
    }, 500);
  }
}
