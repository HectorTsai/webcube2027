// MySQL Adapter — 使用 npm:mysql2/promise 實作 DatabaseAdapter 介面
// 每個 collection = 一張表，JSON 欄位儲存完整記錄
// 相容 MariaDB、TiDB 等 MySQL 協定資料庫
// 注意：PostgreSQL 不相容（協定、SQL 語法、JSON 函數皆不同）

import { createConnection, type Connection } from 'mysql2/promise';
import { sanitizePayload, escapeLike, isSafeIdentifier, type DatabaseAdapter, type QueryOptions, type FieldFilter } from './adapter-interface.ts';
import { error } from '@dui/util';

export interface MysqlConnectOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
}

export class MysqlAdapter implements DatabaseAdapter {
  readonly type = 'mysql';
  private conn: Connection | null = null;

  constructor(private 選項: MysqlConnectOptions) {
  }

  async connect(): Promise<void> {
    if (this.conn) return;

    this.conn = await createConnection({
      host: this.選項.host || 'localhost',
      port: this.選項.port || 3306,
      user: this.選項.user || 'root',
      password: this.選項.password || '',
      database: this.選項.database,
    });

    await this.conn.execute("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';");
  }

  private 拿到連線(): Connection {
    if (!this.conn) throw new Error('MySQL Adapter 尚未初始化，請先呼叫 連線()');
    return this.conn;
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
    // collection 會直接拼入表名位置，必須驗證避免 SQL 注入
    if (!isSafeIdentifier(collection)) return null;
    try {
      const conn = this.拿到連線();
      const [rows] = await conn.execute(
        `SELECT data FROM \`${collection}\` WHERE id = ? LIMIT 1;`,
        [id]
      ) as [any[], unknown];
      if (rows.length > 0 && rows[0].data) {
        return typeof rows[0].data === 'string'
          ? JSON.parse(rows[0].data)
          : rows[0].data as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  async list(collection: string, modelType?: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    try {
      if (!isSafeIdentifier(collection)) return [];
      const conn = this.拿到連線();
      let sql: string;
      let params: any[];
      if (modelType) {
        sql = `SELECT data FROM \`${collection}\` WHERE id LIKE ? ORDER BY updatedAt DESC LIMIT ? OFFSET ?;`;
        params = [`${escapeLike(collection)}:${escapeLike(modelType)}:%`, limitNum, offsetNum];
      } else {
        sql = `SELECT data FROM \`${collection}\` ORDER BY updatedAt DESC LIMIT ? OFFSET ?;`;
        params = [limitNum, offsetNum];
      }
      const [rows] = await conn.execute(sql, params) as [any[], unknown];
      return rows.map((r: any) =>
        typeof r.data === 'string'
          ? JSON.parse(r.data) as Record<string, unknown>
          : r.data as Record<string, unknown>
      );
    } catch {
      return [];
    }
  }

  async create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) throw new Error(`MysqlAdapter: 非法 collection 名稱: ${collection}`);
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(collection);
    const conn = this.拿到連線();
    await conn.execute(
      `INSERT INTO \`${collection}\` (id, data, updatedAt) VALUES (?, ?, ?);`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt as string]
    );
    return dataWithId;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) throw new Error(`MysqlAdapter: 非法 collection 名稱: ${collection}`);
    const dataWithId = sanitizePayload(data, id);
    await this.確保資料表(collection);
    const conn = this.拿到連線();
    await conn.execute(
      `REPLACE INTO \`${collection}\` (id, data, updatedAt) VALUES (?, ?, ?);`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt as string]
    );
    return dataWithId;
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      if (!isSafeIdentifier(filter.field)) return [];
      if (!isSafeIdentifier(collection)) return [];
      const conn = this.拿到連線();
      let sql: string;
      let params: any[];
      if (modelType) {
        sql = `SELECT data FROM \`${collection}\` WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.${filter.field}')) = ? AND id LIKE ?;`;
        params = [filter.value, `${escapeLike(collection)}:${escapeLike(modelType)}:%`];
      } else {
        sql = `SELECT data FROM \`${collection}\` WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.${filter.field}')) = ?;`;
        params = [filter.value];
      }
      const [rows] = await conn.execute(sql, params) as [any[], unknown];
      return rows.map((r: any) =>
        typeof r.data === 'string'
          ? JSON.parse(r.data) as Record<string, unknown>
          : r.data as Record<string, unknown>
      );
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<boolean> {
    const collection = id.split(':')[0];
    if (!isSafeIdentifier(collection)) return false;
    try {
      const conn = this.拿到連線();
      const [result] = await conn.execute(
        `DELETE FROM \`${collection}\` WHERE id = ?;`,
        [id]
      ) as [any, unknown];
      return result.affectedRows > 0;
    } catch {
      return false;
    }
  }

  async patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      if (!isSafeIdentifier(collection)) return null;
      const conn = this.拿到連線();
      const patchJson = JSON.stringify({ ...fields, updatedAt: fields.updatedAt || new Date().toISOString() });
      // JSON_MERGE_PATCH 需 MySQL 5.7+ / MariaDB 10.2.7+（更舊版本無此函數）
      await conn.query(
        `UPDATE \`${collection}\` SET data = JSON_MERGE_PATCH(data, ?), updatedAt = ? WHERE id = ?`,
        [patchJson, fields.updatedAt || new Date().toISOString(), id]
      );
      return this.getById(id);
    } catch {
      return null;
    }
  }

  async count(collection: string, modelType?: string): Promise<number> {
    try {
      if (!isSafeIdentifier(collection)) return 0;
      const conn = this.拿到連線();
      let sql: string;
      let params: any[];
      if (modelType) {
        sql = `SELECT COUNT(*) AS count FROM \`${collection}\` WHERE id LIKE ?;`;
        params = [`${escapeLike(collection)}:${escapeLike(modelType)}:%`];
      } else {
        sql = `SELECT COUNT(*) AS count FROM \`${collection}\`;`;
        params = [];
      }
      const [rows] = await conn.execute(sql, params) as [any[], unknown];
      return rows[0]?.count ?? 0;
    } catch {
      return 0;
    }
  }

  async initialize(collection: string): Promise<void> {
    try {
      if (!isSafeIdentifier(collection)) return;
      await this.確保資料表(collection);
    } catch (err) {
      await error('MysqlAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  /** 確保指定模型的資料表存在 */
  private async 確保資料表(collection: string): Promise<void> {
    if (!isSafeIdentifier(collection)) throw new Error(`MysqlAdapter: 非法 collection 名稱: ${collection}`);
    const conn = this.拿到連線();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`${collection}\` (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX \`idx_${collection}_updated\` (updatedAt DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  /** 輕量連線檢查 */
  async ping(): Promise<boolean> {
    try {
      const conn = this.拿到連線();
      await conn.query('SELECT 1;');
      return true;
    } catch {
      return false;
    }
  }

  async 關閉(): Promise<void> {
    if (this.conn) {
      await this.conn.end();
      this.conn = null;
    }
  }
}
