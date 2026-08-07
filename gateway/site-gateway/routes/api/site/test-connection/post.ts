/**
 * POST /api/site/test-connection — 測試 L3 資料庫連線
 *
 * 直接在 site-gateway 本地使用 @dui/database 建立 adapter 並測試，
 * 不依賴 data-gateway 端點（data-gateway 沒有 test-connection API）。
 *
 * Request:  { l3: { type?/adapter?, host?, port?, username?, password?, database?, filePath?/path? } }
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

    const adapterType = (l3.adapter as string) || (l3.type as string) || 'sqlite';

    // SQLite 測試用：未指定檔名時建立系統暫存檔（避免依賴 cwd / import.meta.dirname 的相對層數）
    const useTempFile = !(l3.filePath as string) && !(l3.path as string);
    const tempFilePath = useTempFile
      ? await Deno.makeTempFile({ prefix: 'webcube-conn-test-', suffix: '.db' })
      : '';

    // 組裝 L2ConnectionInfo
    const info: Record<string, unknown> = {
      type: adapterType,
      ...(l3.host ? { host: l3.host } : {}),
      ...(l3.port ? { port: l3.port } : {}),
      ...(l3.username ? { username: l3.username } : {}),
      ...(l3.password ? { password: l3.password } : {}),
      ...(l3.database ? { database: l3.database } : {}),
      ...(l3.namespace ? { namespace: l3.namespace } : {}),
      ...(l3.credential ? { credential: l3.credential } : {}),
      filePath: (l3.filePath as string) || (l3.path as string) || tempFilePath,
    };

    const adapter = await createAdapter(adapterType, info as never);
    if (!adapter) {
      return c.json({ success: false, error: `不支援的資料庫類型：${adapterType}` }, 400);
    }

    try {
      // 測試資料庫可連線（SQLite 會嘗試建立/開啟檔案）
      await adapter.initialize('使用者');
      // 檢查 使用者 collection 是否已有資料
      let existingUserCount = 0;
      try {
        existingUserCount = await adapter.count('使用者');
      } catch {
        // count() 非所有 adapter 必需，無法取得時視為 0
      }
      return c.json({ success: true, message: '連線成功', existingUserCount });
    } finally {
      // 測試完成後關閉連線
      const anyAdapter = adapter as unknown as { close?: () => Promise<void> | void; 關閉?: () => Promise<void> | void };
      try {
        if (typeof anyAdapter.close === 'function') await anyAdapter.close();
        else if (typeof anyAdapter.關閉 === 'function') await anyAdapter.關閉();
      } catch { /* ignore */ }

      // 使用預設暫存檔時，測試後一併刪除（使用者自填路徑則保留）
      if (useTempFile) {
        try { await Deno.remove(tempFilePath); } catch { /* ignore */ }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `連線測試失敗：${msg}` }, 500);
  }
}
