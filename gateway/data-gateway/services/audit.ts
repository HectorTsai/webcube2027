/**
 * Audit — 審計日誌服務
 *
 * 初始化獨立的 audit.db（SQLite），由 CRUD handler 在寫入操作成功後
 * 自動寫入審計紀錄。寫入失敗不影響主流程，僅以 console.error 記錄。
 *
 * audit.db 與 L1/L2/L3 完全隔離，不影響業務資料庫查詢效能。
 */

import { createAdapter, type DatabaseAdapter } from '@dui/database';

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

let auditAdapter: DatabaseAdapter | null = null;

/**
 * 初始化 audit.db
 * 在 data-gateway 啟動時呼叫（main.ts）
 */
export async function initAudit(dataDir: string): Promise<void> {
  const auditPath = `${dataDir}/audit.db`;
  try {
    auditAdapter = await createAdapter('sqlite', {
      type: 'sqlite',
      filePath: auditPath,
      enabled: true,
    });
    if (auditAdapter) {
      await auditAdapter.initialize('審計日誌');
      console.log('[audit] 審計日誌資料庫初始化完成');
    }
  } catch (err) {
    console.error('[audit] 初始化失敗:', err);
  }
}

/**
 * 寫入一筆審計紀錄
 * 由 CRUD handler 在寫入操作成功後呼叫
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  if (!auditAdapter) return;
  try {
    const id = `審計日誌:操作:${crypto.randomUUID().slice(0, 8)}`;
    await auditAdapter.create('審計日誌', id, {
      id,
      ...entry,
      時間戳: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[audit] 寫入審計日誌失敗:', err);
  }
}