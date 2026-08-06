/**
 * Audit — 審計日誌服務
 *
 * 初始化獨立的 audit.db（SQLite），由 CRUD handler 在寫入操作成功後
 * 自動寫入審計紀錄。寫入失敗不影響主流程，僅以 console.error 記錄。
 *
 * 底層連線已移入 AdapterPool（key: 'AUDIT', persistent），由 DbManager 管理。
 */

import { getDbManager } from './db-manager.ts';

export interface AuditEntry {
  /** 操作者 Gateway 名稱（由 middleware 從 X-API-Key 解析） */
  操作者: string;
  /** 動作：CREATE / UPDATE / PATCH / DELETE */
  動作: string;
  /** 層級：L1 / L2 / L3 */
  層級: string;
  /** 被操作的 composite ID */
  目標: string;
  /** L3 操作的租戶 host（L1/L2 為 null） */
  租戶: string | null;
  /** 人類可讀的變更摘要 */
  變更摘要: string;
}

/**
 * 初始化 audit.db（委託 DbManager 註冊進 AdapterPool）
 */
export async function initAudit(dataDir: string): Promise<void> {
  await getDbManager().initAudit(dataDir);
}

/**
 * 寫入一筆審計紀錄
 * 由 CRUD handler 在寫入操作成功後呼叫
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const adapter = getDbManager()?.Audit;
  if (!adapter) return;
  try {
    const id = `審計日誌:操作:${crypto.randomUUID().slice(0, 8)}`;
    await adapter.create('審計日誌', id, {
      id,
      ...entry,
      時間戳: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[audit] 寫入審計日誌失敗:', err);
  }
}