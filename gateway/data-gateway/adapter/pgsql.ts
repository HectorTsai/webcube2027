// PostgreSQL Adapter — 使用 npm:pg 實作 DatabaseAdapter 介面
// 每個 model = 一張表，JSON 欄位儲存完整記錄
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
import type { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { info, error } from '../logger.ts';

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
  private 已初始化 = new Set<string>();

  constructor(_選項: PgsqlConnectOptions) {
    // 建構時不連線，由 connect() 初始化
  }

  async connect(options: PgsqlConnectOptions): Promise<void> {
    if (this.client) return;

    const config: ClientConfig = options.connectionString
      ? { connectionString: options.connectionString }
      : {
          host: options.host || 'localhost',
          port: options.port || 5432,
          user: options.user || 'postgres',
          password: options.password || '',
          database: options.database || 'webcube',
        };

    this.client = new Client(config);
    await this.client.connect();
  }

  private 拿到連線(): Client {
    if (!this.client) throw new Error('PostgreSQL Adapter 尚未初始化，請先呼叫 連線()');
    return this.client;
  }

  async getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const client = this.拿到連線();
      const result = await client.query(
        `SELECT data FROM "${model}" WHERE id = $1 LIMIT 1;`,
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

  async list(model: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    try {
      const client = this.拿到連線();
      const result = await client.query(
        `SELECT data FROM "${model}" ORDER BY updatedAt DESC LIMIT $1 OFFSET $2;`,
        [limitNum, offsetNum]
      );
      return result.rows.map((r: any) =>
        typeof r.data === 'string'
          ? JSON.parse(r.data) as Record<string, unknown>
          : r.data as Record<string, unknown>
      );
    } catch {
      return [];
    }
  }

  async create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(model);
    const client = this.拿到連線();
    await client.query(
      `INSERT INTO "${model}" (id, data, updatedAt) VALUES ($1, $2, $3);`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt]
    );
    return dataWithId;
  }

  async update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const 序列化資料 = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
      : data;
    const dataWithId = { ...序列化資料, id, updatedAt: new Date().toISOString() };
    await this.確保資料表(model);
    const client = this.拿到連線();
    await client.query(
      `INSERT INTO "${model}" (id, data, updatedAt) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET data = $2, updatedAt = $3;`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt]
    );
    return dataWithId;
  }

  async queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    try {
      const client = this.拿到連線();
      const result = await client.query(
        `SELECT data FROM "${model}" WHERE data->>'${filter.field}' = $1;`,
        [filter.value]
      );
      return result.rows.map((r: any) =>
        typeof r.data === 'string'
          ? JSON.parse(r.data) as Record<string, unknown>
          : r.data as Record<string, unknown>
      );
    } catch {
      return [];
    }
  }

  async delete(model: string, id: string): Promise<boolean> {
    try {
      const client = this.拿到連線();
      const result = await client.query(
        `DELETE FROM "${model}" WHERE id = $1;`,
        [id]
      );
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const client = this.拿到連線();
      const patchJson = JSON.stringify({ ...fields, updatedAt: fields.updatedAt || new Date().toISOString() });
      const result = await client.query(
        `UPDATE "${model}" SET data = data::jsonb || $1::jsonb, updatedAt = $2 WHERE id = $3 RETURNING data;`,
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

  async count(model: string): Promise<number> {
    try {
      const client = this.拿到連線();
      const result = await client.query(
        `SELECT COUNT(*) AS count FROM "${model}";`
      );
      return parseInt(result.rows[0]?.count ?? '0', 10);
    } catch {
      return 0;
    }
  }

  async initialize(model: string): Promise<void> {
    if (this.已初始化.has(model)) return;
    try {
      await this.確保資料表(model);
      this.已初始化.add(model);

      const count = await this.count(model);
      if (count === 0) {
        const { loadSeeds } = await import('../seed-loader.ts');
        const items = await loadSeeds(model);

        if (items && items.length > 0) {
          for (const 實例 of items) {
            try {
              await 實例.init();
              await this.create(model, 實例.id, 實例.toJSON());
            } catch (err) {
              await error('PgsqlAdapter', `匯入種子失敗 ${model}/${實例.id}: ${err}`);
            }
          }
          await info('PgsqlAdapter', `${model} 種子匯入完成，共 ${items.length} 筆`);
        }
      }
    } catch (err) {
      await error('PgsqlAdapter', `初始化 ${model} 失敗: ${err}`);
    }
  }

  /** 確保指定模型的資料表存在 */
  private async 確保資料表(model: string): Promise<void> {
    const client = this.拿到連線();
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${model}" (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_${model}_updated" ON "${model}" (updatedAt DESC);
    `);
  }

  async 關閉(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
