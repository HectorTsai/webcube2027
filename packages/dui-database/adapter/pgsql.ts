// PostgreSQL Adapter — 使用 npm:pg 實作 DatabaseAdapter 介面
// 每個 collection = 一張表，JSON 欄位儲存完整記錄
// 注意：MySQL/MariaDB 不相容（需使用 mysql.ts adapter）
//
// 此 adapter 同時相容 **Supabase**（設定方式見下方註解）：
//   類型: "postgresql"
//   主機: "db.xxxxxxxxxxxx.supabase.co"
//   埠號: 5432
//   使用者名稱: "postgres"
//   密碼: "你的資料庫密碼"
//   資料庫名稱: "postgres"

import { Client, type ClientConfig } from 'pg';
import { sanitizePayload, escapeLike, isSafeIdentifier, type DatabaseAdapter, type QueryOptions, type FieldFilter } from './adapter-interface.ts';
import { error } from '@dui/util';

export interface PgsqlConnectOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionString?: string; // PostgreSQL 連線字串，若提供則優先於個別欄位
}

export class PgsqlAdapter implements DatabaseAdapter {
  readonly type = 'postgresql';
  private client: Client | null = null;

  constructor(private 選項: PgsqlConnectOptions) {
  }

  async connect(): Promise<void> {
    if (this.client) return;

    const config: ClientConfig = this.選項.connectionString
      ? { connectionString: this.選項.connectionString }
      : {
          host: this.選項.host || 'localhost',
          port: this.選項.port || 5432,
          user: this.選項.user || 'postgres',
          password: this.選項.password || '',
          database: this.選項.database || 'webcube',
        };

    this.client = new Client(config);
    await this.client.connect();
  }

  private 拿到連線(): Client {
    if (!this.client) throw new Error('PostgreSQL Adapter 尚未初始化，請先呼叫 連線()');
    return this.client;
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
    // collection 會直接拼入表名位置，必須驗證避免 SQL 注入
    if (!isSafeIdentifier(collection)) return null;
    try {
      const client = this.拿到連線();
      const result = await client.query(
        `SELECT data FROM "${collection}" WHERE id = $1 LIMIT 1;`,
        [id]
      );
      if (result.rows.length > 0 && result.rows[0].data) {
        return typeof result.rows[0].data === 'string'
          ? JSON.parse(result.rows[0].data)
          : result.rows[0].data as Record<string, unknown>;
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
      const client = this.拿到連線();
      let sql: string;
      let params: unknown[];
      if (modelType) {
        sql = `SELECT data FROM "${collection}" WHERE id LIKE $3 ORDER BY updatedAt DESC LIMIT $1 OFFSET $2;`;
        params = [limitNum, offsetNum, `${collection}:${modelType}:%`];
      } else {
        sql = `SELECT data FROM "${collection}" ORDER BY updatedAt DESC LIMIT $1 OFFSET $2;`;
        params = [limitNum, offsetNum];
      }
      const result = await client.query(sql, params);
      return result.rows.map((r: any) =>
        typeof r.data === 'string'
          ? JSON.parse(r.data) as Record<string, unknown>
          : r.data as Record<string, unknown>
      );
    } catch {
      return [];
    }
  }

  async create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) throw new Error(`PgsqlAdapter: 非法 collection 名稱: ${collection}`);
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(collection);
    const client = this.拿到連線();
    await client.query(
      `INSERT INTO "${collection}" (id, data, updatedAt) VALUES ($1, $2, $3);`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt]
    );
    return dataWithId;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) throw new Error(`PgsqlAdapter: 非法 collection 名稱: ${collection}`);
    const dataWithId = sanitizePayload(data, id);
    await this.確保資料表(collection);
    const client = this.拿到連線();
    await client.query(
      `INSERT INTO "${collection}" (id, data, updatedAt) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET data = $2, updatedAt = $3;`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt]
    );
    return dataWithId;
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      if (!isSafeIdentifier(filter.field)) return [];
      if (!isSafeIdentifier(collection)) return [];
      const client = this.拿到連線();
      let sql: string;
      let params: unknown[];
      if (modelType) {
        sql = `SELECT data FROM "${collection}" WHERE data->>'${filter.field}' = $1 AND id LIKE $2;`;
        params = [filter.value, `${escapeLike(collection)}:${escapeLike(modelType)}:%`];
      } else {
        sql = `SELECT data FROM "${collection}" WHERE data->>'${filter.field}' = $1;`;
        params = [filter.value];
      }
      const result = await client.query(sql, params);
      return result.rows.map((r: any) =>
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
      const client = this.拿到連線();
      const result = await client.query(
        `DELETE FROM "${collection}" WHERE id = $1;`,
        [id]
      );
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      if (!isSafeIdentifier(collection)) return null;
      const client = this.拿到連線();
      const patchJson = JSON.stringify({ ...fields, updatedAt: fields.updatedAt || new Date().toISOString() });
      const result = await client.query(
        `UPDATE "${collection}" SET data = data::jsonb || $1::jsonb, updatedAt = $2 WHERE id = $3 RETURNING data;`,
        [patchJson, fields.updatedAt || new Date().toISOString(), id]
      );
      if (result.rows.length > 0) {
        return typeof result.rows[0].data === 'string'
          ? JSON.parse(result.rows[0].data)
          : result.rows[0].data as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  async count(collection: string, modelType?: string): Promise<number> {
    try {
      if (!isSafeIdentifier(collection)) return 0;
      const client = this.拿到連線();
      let sql: string;
      let params: unknown[];
      if (modelType) {
        sql = `SELECT COUNT(*) AS count FROM "${collection}" WHERE id LIKE $1;`;
        params = [`${escapeLike(collection)}:${escapeLike(modelType)}:%`];
      } else {
        sql = `SELECT COUNT(*) AS count FROM "${collection}";`;
        params = [];
      }
      const result = await client.query(sql, params);
      return parseInt(result.rows[0]?.count ?? '0', 10);
    } catch {
      return 0;
    }
  }

  async initialize(collection: string): Promise<void> {
    try {
      if (!isSafeIdentifier(collection)) return;
      await this.確保資料表(collection);
    } catch (err) {
      await error('PgsqlAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  /** 確保指定模型的資料表存在 */
  private async 確保資料表(collection: string): Promise<void> {
    if (!isSafeIdentifier(collection)) throw new Error(`PgsqlAdapter: 非法 collection 名稱: ${collection}`);
    const client = this.拿到連線();
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${collection}" (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_${collection}_updated" ON "${collection}" (updatedAt DESC);
    `);
  }

  /** 輕量連線檢查 */
  async ping(): Promise<boolean> {
    try {
      const client = this.拿到連線();
      await client.query('SELECT 1;');
      return true;
    } catch {
      return false;
    }
  }

  async 關閉(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
