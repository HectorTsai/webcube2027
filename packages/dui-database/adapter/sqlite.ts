// SQLite Adapter — 使用 Deno 內建 node:sqlite 實作 DatabaseAdapter 介面
// 每個 collection = 一張表，內含多種 model type
// 適用於租戶自備 SQLite 檔案（零依賴、輕量）
//
// 此 adapter 同時相容 **Turso / LibSQL**（Edge 環境需自行處理同步）：

import { DatabaseSync } from 'node:sqlite';
import { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { error } from '@dui/util';

export class SqliteAdapter implements DatabaseAdapter {
  readonly type = 'sqlite';
  private db: DatabaseSync;

  constructor(檔案路徑: string) {
    this.db = new DatabaseSync(檔案路徑);

    // 啟用 WAL 模式提升並行效能
    this.db.exec('PRAGMA journal_mode=WAL;');
    this.db.exec('PRAGMA foreign_keys=ON;');
  }

  getById(id: string): Promise<Record<string, unknown> | null> {
    try {
      // 從 composite ID 解析 collection 名稱（第 1 段）
      const collection = id.split(':')[0];
      const stmt = this.db.prepare(`SELECT data FROM "${collection}" WHERE id = ? LIMIT 1;`);
      const row = stmt.get(id) as { data: string } | undefined;
      if (row?.data) {
        return Promise.resolve(JSON.parse(row.data) as Record<string, unknown>);
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  }

  list(collection: string, modelType?: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    try {
      let sql: string;
      if (modelType) {
        // 篩選特定 model type：id 的第 2 段 = modelType
        sql = `SELECT data FROM "${collection}" WHERE id LIKE ? ORDER BY updatedAt DESC LIMIT ? OFFSET ?;`;
        const rows = this.db.prepare(sql).all(`${collection}:${modelType}:%`, limitNum, offsetNum) as { data: string }[];
        return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
      } else {
        sql = `SELECT data FROM "${collection}" ORDER BY updatedAt DESC LIMIT ? OFFSET ?;`;
        const rows = this.db.prepare(sql).all(limitNum, offsetNum) as { data: string }[];
        return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
      }
    } catch {
      return Promise.resolve([]);
    }
  }

  create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    this.確保資料表(collection);
    const stmt = this.db.prepare(
      `INSERT INTO "${collection}" (id, data, updatedAt) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.updatedAt as string);
    return Promise.resolve(dataWithId);
  }

  update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const 序列化資料 = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
      : data;
    const dataWithId = { ...序列化資料, id, updatedAt: new Date().toISOString() };
    this.確保資料表(collection);
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO "${collection}" (id, data, updatedAt) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.updatedAt as string);
    return Promise.resolve(dataWithId);
  }

  queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      if (modelType) {
        const stmt = this.db.prepare(
          `SELECT data FROM "${collection}" WHERE json_extract(data, '$.${filter.field}') = ? AND id LIKE ?;`
        );
        const rows = stmt.all(filter.value, `${collection}:${modelType}:%`) as { data: string }[];
        return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
      } else {
        const stmt = this.db.prepare(
          `SELECT data FROM "${collection}" WHERE json_extract(data, '$.${filter.field}') = ?;`
        );
        const rows = stmt.all(filter.value) as { data: string }[];
        return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
      }
    } catch {
      return Promise.resolve([]);
    }
  }

  delete(id: string): Promise<boolean> {
    try {
      const collection = id.split(':')[0];
      const stmt = this.db.prepare(`DELETE FROM "${collection}" WHERE id = ?;`);
      stmt.run(id);
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const patchJson = JSON.stringify({ ...fields, updatedAt: fields.updatedAt || new Date().toISOString() });
      const updatedAtVal = (fields.updatedAt || new Date().toISOString()) as string;
      const stmt = this.db.prepare(
        `UPDATE "${collection}" SET data = json_patch(data, ?), updatedAt = ? WHERE id = ?`
      );
      stmt.run(patchJson as string, updatedAtVal, id);
      // 回傳更新後的完整記錄
      const getStmt = this.db.prepare(`SELECT data FROM "${collection}" WHERE id = ? LIMIT 1;`);
      const row = getStmt.get(id) as { data: string } | undefined;
      if (row?.data) {
        return Promise.resolve(JSON.parse(row.data) as Record<string, unknown>);
      }
      return Promise.resolve(null);
    } catch {
      return Promise.resolve(null);
    }
  }

  count(collection: string, modelType?: string): Promise<number> {
    try {
      if (modelType) {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM "${collection}" WHERE id LIKE ?;`);
        const row = stmt.get(`${collection}:${modelType}:%`) as { count: number } | undefined;
        return Promise.resolve(row?.count ?? 0);
      } else {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM "${collection}";`);
        const row = stmt.get() as { count: number } | undefined;
        return Promise.resolve(row?.count ?? 0);
      }
    } catch {
      return Promise.resolve(0);
    }
  }

  async initialize(collection: string): Promise<void> {
    try {
      this.確保資料表(collection);
    } catch (err) {
      await error('SqliteAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  listModelTypes(collection: string): Promise<string[]> {
    try {
      const stmt = this.db.prepare(`SELECT DISTINCT id FROM "${collection}";`);
      const rows = stmt.all() as { id: string }[];
      const types = new Set<string>();
      for (const row of rows) {
        const parts = row.id.split(':');
        if (parts.length >= 2) {
          types.add(parts[1]);
        }
      }
      return Promise.resolve([...types].sort());
    } catch {
      return Promise.resolve([]);
    }
  }

  /** 確保指定 collection 的資料表存在 */
  private 確保資料表(collection: string): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS "${collection}" (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    // 確保索引存在
    try {
      this.db.exec(`CREATE INDEX IF NOT EXISTS "idx_${collection}_updated" ON "${collection}" (updatedAt DESC);`);
    } catch { /* 索引已存在 */ }
  }

  /** 關閉資料庫連線 */
  關閉(): void {
    this.db.close();
  }
}
