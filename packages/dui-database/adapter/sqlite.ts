// SQLite Adapter — 使用 Deno 內建 node:sqlite 實作 DatabaseAdapter 介面
// 每個 collection = 一張表，內含多種 model type
// 適用於租戶自備 SQLite 檔案（零依賴、輕量）
//
// 此 adapter 同時相容 **Turso / LibSQL**（Edge 環境需自行處理同步）：

import { DatabaseSync } from 'node:sqlite';
import {
  sanitizePayload, escapeLike, isSafeIdentifier,
  type DatabaseAdapter, type QueryOptions, type FieldFilter,
} from './adapter-interface.ts';
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
      // collection 會直接拼入表名位置，必須驗證避免 SQL 注入
      if (!isSafeIdentifier(collection)) return Promise.resolve(null);
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
    try {
      if (!isSafeIdentifier(collection)) return Promise.resolve([]);
      const limitNum = options?.limit ?? 50;
      const offsetNum = options?.offset ?? 0;
      const filter = options?.filter;
      const sortField = options?.sort;
      const sortOrder = options?.order === 'asc' ? 'ASC' : 'DESC';

      const conditions: string[] = [];
      const params: unknown[] = [];

      if (modelType) {
        conditions.push('id LIKE ?');
        params.push(`${escapeLike(collection)}:${escapeLike(modelType)}:%`);
      }

      // 欄位篩選：WHERE json_extract(data, '$.field') = ?
      // 僅允許安全欄位名稱，避免 SQL 注入
      if (filter) {
        for (const [field, value] of Object.entries(filter)) {
          if (!isSafeIdentifier(field)) continue;
          conditions.push(`json_extract(data, '$.${field}') = ?`);
          params.push(value);
        }
      }

      // 排序：ORDER BY json_extract(data, '$.field')
      let orderClause = 'ORDER BY updatedAt DESC';
      if (sortField && isSafeIdentifier(sortField)) {
        orderClause = `ORDER BY json_extract(data, '$.${sortField}') ${sortOrder}`;
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT data FROM "${collection}" ${where} ${orderClause} LIMIT ? OFFSET ?;`;
      params.push(limitNum, offsetNum);

      const rows = this.db.prepare(sql).all(...params as []) as { data: string }[];
      return Promise.resolve(rows.map((r) => JSON.parse(r.data) as Record<string, unknown>));
    } catch (err) {
      return Promise.resolve([]);
    }
  }

  create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) {
      return Promise.reject(new Error(`SqliteAdapter: 非法 collection 名稱: ${collection}`));
    }
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    this.確保資料表(collection);
    const stmt = this.db.prepare(
      `INSERT INTO "${collection}" (id, data, updatedAt) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.updatedAt as string);
    return Promise.resolve(dataWithId);
  }

  update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) {
      return Promise.reject(new Error(`SqliteAdapter: 非法 collection 名稱: ${collection}`));
    }
    const dataWithId = sanitizePayload(data, id);
    this.確保資料表(collection);
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO "${collection}" (id, data, updatedAt) VALUES (?, ?, ?);`
    );
    stmt.run(id, JSON.stringify(dataWithId), dataWithId.updatedAt as string);
    return Promise.resolve(dataWithId);
  }

  queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      if (!isSafeIdentifier(filter.field)) return Promise.resolve([]);
      if (!isSafeIdentifier(collection)) return Promise.resolve([]);
      if (modelType) {
        const stmt = this.db.prepare(
          `SELECT data FROM "${collection}" WHERE json_extract(data, '$.${filter.field}') = ? AND id LIKE ?;`
        );
        const rows = stmt.all(filter.value, `${escapeLike(collection)}:${escapeLike(modelType)}:%`) as { data: string }[];
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
      if (!isSafeIdentifier(collection)) return Promise.resolve(false);
      const stmt = this.db.prepare(`DELETE FROM "${collection}" WHERE id = ?;`);
      const res = stmt.run(id);
      // 依實際刪除的列數判斷是否存在（與 mssql/mongodb 等其他 adapter 語意一致）
      return Promise.resolve(res.changes > 0);
    } catch {
      return Promise.resolve(false);
    }
  }

  patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      if (!isSafeIdentifier(collection)) return Promise.resolve(null);
      // updatedAt 一律正規化為 ISO 字串，避免 Date 物件被直接寫入 SQLite
      const updatedAtVal = typeof fields.updatedAt === 'string'
        ? fields.updatedAt
        : (fields.updatedAt instanceof Date ? fields.updatedAt.toISOString() : new Date().toISOString());
      const patchJson = JSON.stringify({ ...fields, updatedAt: updatedAtVal });
      // 使用 RETURNING data 省去二次 SELECT（需 SQLite 3.35+）
      const stmt = this.db.prepare(
        `UPDATE "${collection}" SET data = json_patch(data, ?), updatedAt = ? WHERE id = ? RETURNING data;`
      );
      const row = stmt.get(patchJson as string, updatedAtVal, id) as { data: string } | undefined;
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
      if (!isSafeIdentifier(collection)) return Promise.resolve(0);
      if (modelType) {
        const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM "${collection}" WHERE id LIKE ?;`);
        const row = stmt.get(`${escapeLike(collection)}:${escapeLike(modelType)}:%`) as { count: number } | undefined;
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
      if (!isSafeIdentifier(collection)) return;
      this.確保資料表(collection);
    } catch (err) {
      await error('SqliteAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  listModelTypes(collection: string): Promise<string[]> {
    try {
      if (!isSafeIdentifier(collection)) return Promise.resolve([]);
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
    if (!isSafeIdentifier(collection)) {
      throw new Error(`SqliteAdapter: 非法 collection 名稱: ${collection}`);
    }
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

  /** 輕量連線檢查 */
  ping(): Promise<boolean> {
    try {
      this.db.prepare('SELECT 1;').get();
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  /** 關閉資料庫連線 */
  關閉(): void {
    this.db.close();
  }
}
