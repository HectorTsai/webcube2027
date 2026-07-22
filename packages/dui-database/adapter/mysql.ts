// MySQL Adapter — 使用 npm:mysql2/promise 實作 DatabaseAdapter 介面
// 每個 collection = 一張表，JSON 欄位儲存完整記錄
// 相容 MariaDB、TiDB 等 MySQL 協定資料庫
// 注意：PostgreSQL 不相容（協定、SQL 語法、JSON 函數皆不同）

import { createConnection, type Connection } from 'mysql2/promise';
import type { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { error } from '../logger.ts';

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

  constructor(_選項: MysqlConnectOptions) {
    // 建構時不連線，由 connect() 初始化
  }

  async connect(options: MysqlConnectOptions): Promise<void> {
    if (this.conn) return;

    this.conn = await createConnection({
      host: options.host || 'localhost',
      port: options.port || 3306,
      user: options.user || 'root',
      password: options.password || '',
      database: options.database,
    });

    await this.conn.execute("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';");
  }

  private 拿到連線(): Connection {
    if (!this.conn) throw new Error('MySQL Adapter 尚未初始化，請先呼叫 連線()');
    return this.conn;
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
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
      const conn = this.拿到連線();
      let sql: string;
      let params: any[];
      if (modelType) {
        sql = `SELECT data FROM \`${collection}\` WHERE id LIKE ? ORDER BY updatedAt DESC LIMIT ? OFFSET ?;`;
        params = [`${collection}:${modelType}:%`, limitNum, offsetNum];
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
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(collection);
    const conn = this.拿到連線();
    await conn.execute(
      `INSERT INTO \`${collection}\` (id, data, updatedAt) VALUES (?, ?, ?);`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt]
    );
    return dataWithId;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const 序列化資料 = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
      : data;
    const dataWithId = { ...序列化資料, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(collection);
    const conn = this.拿到連線();
    await conn.execute(
      `REPLACE INTO \`${collection}\` (id, data, updatedAt) VALUES (?, ?, ?);`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt]
    );
    return dataWithId;
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      const conn = this.拿到連線();
      let sql: string;
      let params: any[];
      if (modelType) {
        sql = `SELECT data FROM \`${collection}\` WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.${filter.field}')) = ? AND id LIKE ?;`;
        params = [filter.value, `${collection}:${modelType}:%`];
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
      const conn = this.拿到連線();
      const patchJson = JSON.stringify({ ...fields, updatedAt: fields.updatedAt || new Date().toISOString() });
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
      const conn = this.拿到連線();
      let sql: string;
      let params: any[];
      if (modelType) {
        sql = `SELECT COUNT(*) AS count FROM \`${collection}\` WHERE id LIKE ?;`;
        params = [`${collection}:${modelType}:%`];
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
      await this.確保資料表(collection);
    } catch (err) {
      await error('MysqlAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  /** 確保指定模型的資料表存在 */
  private async 確保資料表(collection: string): Promise<void> {
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

  async 關閉(): Promise<void> {
    if (this.conn) {
      await this.conn.end();
      this.conn = null;
    }
  }
}
