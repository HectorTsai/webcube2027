/**
 * POST /api/site/test-connection — 測試 L3 資料庫連線
 *
 * 直接在 site-gateway 本地使用 @dui/database 建立 adapter 並測試，
 * 不依賴 data-gateway 端點（data-gateway 沒有 test-connection API）。
 *
 * Request:  { l3: { adapter?, host?, port?, username?, password?, database?, path? } }
 * Response: { success: true } | { success: false, error }
 */

import type { Context } from 'hono';
import { createAdapter } from '@dui/database';

export async function POST(c: Context) {
  try {
    const body = await c.req.json() as { l3?: Record<string, unknown> };
    const l3 = body.l3;
    if (!l3 || typeof l3 !== 'object') {
      return c.json({ success: false, error: '請提供 l3 連線設定' }, 400);
    }

    const adapterType = (l3.adapter as string) || 'sqlite';

    // 組裝 L2ConnectionInfo
    const info: Record<string, unknown> = {
      type: adapterType,
      ...(l3.host ? { host: l3.host } : {}),
      ...(l3.port ? { port: l3.port } : {}),
      ...(l3.username ? { username: l3.username } : {}),
      ...(l3.password ? { password: l3.password } : {}),
      ...(l3.database ? { database: l3.database } : {}),
      // SQLite：測試用的暫存檔案，測試後刪除
      path: (l3.path as string) || `./data/__connection_test__.db`,
    };

    const adapter = await createAdapter(adapterType, info as never);
    if (!adapter) {
      return c.json({ success: false, error: `不支援的資料庫類型：${adapterType}` }, 400);
    }

    try {
      // 測試資料庫可連線（SQLite 會嘗試建立/開啟檔案）
      await adapter.initialize('使用者');
      return c.json({ success: true, message: '連線成功' });
    } finally {
      // 測試完成後關閉連線
      const anyAdapter = adapter as unknown as { close?: () => Promise<void> | void; 關閉?: () => Promise<void> | void };
      try {
        if (typeof anyAdapter.close === 'function') await anyAdapter.close();
        else if (typeof anyAdapter.關閉 === 'function') await anyAdapter.關閉();
      } catch { /* ignore */ }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `連線測試失敗：${msg}` }, 500);
  }
}
