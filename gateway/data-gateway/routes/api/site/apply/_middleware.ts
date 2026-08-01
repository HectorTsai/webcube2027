/**
 * /api/site/apply/* — 網站申請 Middleware
 *
 * 從 request body 讀取 網址 欄位，檢查網站是否已存在。
 * 避免重複申請同一網域。
 */

import type { Context, Next } from 'hono';
import { getDbManager } from '../../../../services/db-manager.ts';

export const middleware = async (c: Context, next: Next) => {
  // 只在 POST 時檢查
  if (c.req.method !== 'POST') {
    await next();
    return;
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    // body 無法解析 JSON — 留給 handler 處理
    await next();
    return;
  }

  const 網址 = body?.網址;
  if (!網址) {
    await next();
    return;
  }

  let host: string;
  try {
    const rawUrl = 網址.startsWith('http') ? 網址 : `http://${網址}`;
    host = new URL(rawUrl).hostname;
  } catch {
    await next();
    return;
  }

  // 查詢 L2 是否已有此網站
  const system = getDbManager().System;
  if (system) {
    try {
      const existing = await system.getById(`網站資訊:網站資訊:${host}`);
      if (existing) {
        return c.json({ success: false, error: `網站 ${host} 已經存在，請勿重複申請` }, 400);
      }
    } catch {
      // 查詢失敗 — 留給 handler 處理
    }
  }

  await next();
};