/**
 * POST /api/site/test-connection
 * 測試 L3 資料庫連線（不持久化任何資料）
 *
 * 請求主體：{ l3: { type, host, port, ... } }
 * 回傳：{ success: true, message, data }
 */

import type { Context } from 'hono';
import { dataPool } from '@dui/database';

export const POST = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { l3 } = body;

    if (!l3 || !l3.type) {
      return c.json({ success: false, error: '請提供資料庫連線資訊' }, 400);
    }

    const result = await dataPool.testConnection({ ...l3, enabled: true });

    // 將 result.ok 映射到 HTTP 回應成功狀態，便於前端判讀
    if (!result.ok) {
      return c.json({
        success: false,
        error: result.message || '連線測試失敗，請檢查資料庫設定',
        data: result,
      }, 400);
    }

    return c.json({
      success: true,
      message: result.message || '資料庫連線測試成功',
      data: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: msg }, 500);
  }
};
