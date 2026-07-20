// SQLite Adapter — 使用 Deno 內建 node:sqlite 實作 DatabaseAdapter 介面
// 每個 model = 一張表，JSON 欄位儲存完整記錄
// 適用於租戶自備 SQLite 檔案（零依賴、輕量）
//
// 此 adapter 同時相容 **Turso / LibSQL**（Edge 環境需自行處理同步）：

import { DatabaseSync } from 'node:sqlite';
import { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { info, error } from '../logger.ts';

export class SqliteAdapter implements DatabaseAdapter {
  readonly type = 'sqlite';
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

  getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const stmt = this.db.prepare(`SELECT data FROM "${model}" WHERE id = ? LIMIT 1;`);
      const row = stmt.get(id) as { data: string } | undefined;
      if (row?.data) {
        return Promise.resolve(JSON.parse(row.data) as Record<string, unknown>);
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  }

  list(model: string, options: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options.limit ?? 50;
    const offsetNum = options.offset ?? 0;
    try {
      const stmt = this.db.prepare(
        `SELECT data FROM "${model}" ORDER BY updatedAt DESC LIMIT ? OFFSET ?;`
      );
      const rows = stmt.all(limitNum, offsetNum) as { data: string }[];
      return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
    } catch {
      return Promise.resolve([]);
    }
  }

  async create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(model);
    const stmt = this.db.prepare(
      `INSERT INTO "${model}" (id, data, updatedAt) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.updatedAt as string);
    return dataWithId;
  }

  async update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // 防呆：若呼叫端傳入的是 Model 實例，自動呼叫 toJSON() 取完整資料
    // 避免「只想改一個欄位卻覆蓋整筆」的 bug
    const 序列化資料 = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
      : data;
    const dataWithId = { ...序列化資料, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(model);
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO "${model}" (id, data, updatedAt) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.updatedAt as string);
    return dataWithId;
  }

  queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    try {
      const stmt = this.db.prepare(
        `SELECT data FROM "${model}" WHERE json_extract(data, '$.${filter.field}') = ?;`
      );
      const rows = stmt.all(filter.value) as { data: string }[];
      return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
    } catch {
      return Promise.resolve([]);
    }
  }

  delete(model: string, id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`DELETE FROM "${model}" WHERE id = ?;`);
      stmt.run(id);
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const patchJson = JSON.stringify({ ...fields, updatedAt: fields.updatedAt || new Date().toISOString() });
      const updatedAtVal = (fields.updatedAt || new Date().toISOString()) as string;
      const stmt = this.db.prepare(
        `UPDATE "${model}" SET data = json_patch(data, ?), updatedAt = ? WHERE id = ?`
      );
      stmt.run(patchJson as string, updatedAtVal, id);
      return this.getById(model, id);
    } catch {
      return Promise.resolve(null);
    }
  }

  count(model: string): Promise<number> {
    try {
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM "${model}";`);
      const row = stmt.get() as { count: number } | undefined;
      return Promise.resolve(row?.count ?? 0);
    } catch {
      return Promise.resolve(0);
    }
  }

  async initialize(model: string): Promise<void> {
    try {
      // 檢查是否已初始化過
      const metaStmt = this.db.prepare('SELECT model FROM _meta WHERE model = ?;');
      const existing = metaStmt.get(model);
      if (existing) return;

      // 確保資料表存在
      await this.確保資料表(model);

      // 若為空則匯入種子
      const count = await this.count(model);
      if (count === 0) {
        const { loadSeeds } = await import('../index.ts');
        const items = await loadSeeds(model);

        if (items && items.length > 0) {
          for (const 實例 of items) {
            try {
              await 實例.init();
              await this.create(model, 實例.id, 實例.toJSON());
            } catch (err) {
              await error('SqliteAdapter', `匯入種子失敗 ${model}/${實例.id}: ${err}`);
            }
          }
          await info('SqliteAdapter', `${model} 種子匯入完成，共 ${items.length} 筆`);
        }
      }

      // 標記已初始化
      this.db.prepare('INSERT INTO _meta (model) VALUES (?);').run(model);
    } catch (err) {
      await error('SqliteAdapter', `初始化 ${model} 失敗: ${err}`);
    }
  }

  /** 確保指定模型的資料表存在 */
  private 確保資料表(model: string): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS "${model}" (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    // 確保索引存在
    try {
      this.db.exec(`CREATE INDEX IF NOT EXISTS "idx_${model}_updated" ON "${model}" (updatedAt DESC);`);
    } catch { /* 索引已存在 */ }
    return Promise.resolve();
  }

  /** 關閉資料庫連線 */
  關閉(): void {
    this.db.close();
  }
}
