// SQLite Adapter — 使用 Deno 內建 node:sqlite 實作 L3DatabaseAdapter 介面
// 每個 model = 一張表，JSON 欄位儲存完整記錄
// 適用於租戶自備 SQLite 檔案（零依賴、輕量）

import { DatabaseSync } from 'node:sqlite';
import { L3DatabaseAdapter, 查詢選項 } from './adapter-interface.ts';
import { info, error } from '../../utils/logger.ts';

export class SqliteAdapter implements L3DatabaseAdapter {
  readonly 類型 = 'sqlite';
  private db: DatabaseSync;

  constructor(檔案路徑: string) {
    this.db = new DatabaseSync(檔案路徑);

    // 啟用 WAL 模式提升並行效能
    this.db.exec('PRAGMA journal_mode=WAL;');
    this.db.exec('PRAGMA foreign_keys=ON;');

    // 建立元資料表（追蹤已初始化的 model）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _meta (
        model TEXT PRIMARY KEY,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  查詢單一(模型: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const stmt = this.db.prepare(`SELECT data FROM "${模型}" WHERE id = ? LIMIT 1;`);
      const row = stmt.get(id) as { data: string } | undefined;
      if (row?.data) {
        return Promise.resolve(JSON.parse(row.data) as Record<string, unknown>);
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  }

  查詢列表(模型: string, 選項: 查詢選項): Promise<Record<string, unknown>[]> {
    const limitNum = 選項.limit ?? 50;
    const offsetNum = 選項.offset ?? 0;
    try {
      const stmt = this.db.prepare(
        `SELECT data FROM "${模型}" ORDER BY 最後修改 DESC LIMIT ? OFFSET ?;`
      );
      const rows = stmt.all(limitNum, offsetNum) as { data: string }[];
      return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
    } catch {
      return Promise.resolve([]);
    }
  }

  async 創建(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, id, 最後修改: new Date().toISOString() };
    await this.確保資料表(模型);
    const stmt = this.db.prepare(
      `INSERT INTO "${模型}" (id, data, 最後修改) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.最後修改 as string);
    return dataWithId;
  }

  async 更新(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, id, 最後修改: new Date().toISOString() };
    await this.確保資料表(模型);
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO "${模型}" (id, data, 最後修改) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.最後修改 as string);
    return dataWithId;
  }

  刪除(模型: string, id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`DELETE FROM "${模型}" WHERE id = ?;`);
      stmt.run(id);
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  個數(模型: string): Promise<number> {
    try {
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM "${模型}";`);
      const row = stmt.get() as { count: number } | undefined;
      return Promise.resolve(row?.count ?? 0);
    } catch {
      return Promise.resolve(0);
    }
  }

  async 初始化(模型: string): Promise<void> {
    try {
      // 檢查是否已初始化過
      const metaStmt = this.db.prepare('SELECT model FROM _meta WHERE model = ?;');
      const existing = metaStmt.get(模型);
      if (existing) return;

      // 確保資料表存在
      await this.確保資料表(模型);

      // 若為空則匯入種子
      const count = await this.個數(模型);
      if (count === 0) {
        const { 讀取種子 } = await import('../index.ts');
        const items = await 讀取種子(模型);

        if (items && items.length > 0) {
          for (const 實例 of items) {
            try {
              await 實例.初始化();
              await this.創建(模型, 實例.id, 實例.toJSON());
            } catch (err) {
              await error('SqliteAdapter', `匯入種子失敗 ${模型}/${實例.id}: ${err}`);
            }
          }
          await info('SqliteAdapter', `${模型} 種子匯入完成，共 ${items.length} 筆`);
        }
      }

      // 標記已初始化
      this.db.prepare('INSERT INTO _meta (model) VALUES (?);').run(模型);
    } catch (err) {
      await error('SqliteAdapter', `初始化 ${模型} 失敗: ${err}`);
    }
  }

  /** 確保指定模型的資料表存在 */
  private 確保資料表(模型: string): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS "${模型}" (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        最後修改 TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    // 確保索引存在
    try {
      this.db.exec(`CREATE INDEX IF NOT EXISTS "idx_${模型}_修改" ON "${模型}" (最後修改 DESC);`);
    } catch { /* 索引已存在 */ }
    return Promise.resolve();
  }

  /** 關閉資料庫連線 */
  關閉(): void {
    this.db.close();
  }
}
