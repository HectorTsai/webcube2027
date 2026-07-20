// MySQL Adapter — 使用 npm:mysql2/promise 實作 DatabaseAdapter 介面
// 每個 model = 一張表，JSON 欄位儲存完整記錄
// 相容 MariaDB、TiDB 等 MySQL 協定資料庫
// 注意：PostgreSQL 不相容（協定、SQL 語法、JSON 函數皆不同）

import { createConnection, type Connection } from 'mysql2/promise';
import type { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { info, error } from '../logger.ts';

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
  private 已初始化 = new Set<string>();

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

  async getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    try {
      const conn = this.拿到連線();
      const [rows] = await conn.execute(
        `SELECT data FROM \`${model}\` WHERE id = ? LIMIT 1;`,
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

  async list(model: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    try {
      const conn = this.拿到連線();
      const [rows] = await conn.execute(
        `SELECT data FROM \`${model}\` ORDER BY updatedAt DESC LIMIT ? OFFSET ?;`,
        [limitNum, offsetNum]
      ) as [any[], unknown];
      return rows.map((r: any) =>
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
    const conn = this.拿到連線();
    await conn.execute(
      `INSERT INTO \`${model}\` (id, data, updatedAt) VALUES (?, ?, ?);`,
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
    const conn = this.拿到連線();
    await conn.execute(
      `REPLACE INTO \`${model}\` (id, data, updatedAt) VALUES (?, ?, ?);`,
      [id, JSON.stringify(dataWithId), dataWithId.updatedAt]
    );
    return dataWithId;
  }

  async queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    try {
      const conn = this.拿到連線();
      const [rows] = await conn.execute(
        `SELECT data FROM \`${model}\` WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.${filter.field}')) = ?;`,
        [filter.value]
      ) as [any[], unknown];
      return rows.map((r: any) =>
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
      const conn = this.拿到連線();
      const [result] = await conn.execute(
        `DELETE FROM \`${model}\` WHERE id = ?;`,
        [id]
      ) as [any, unknown];
      return result.affectedRows > 0;
    } catch {
      return false;
    }
  }

  async patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const conn = this.拿到連線();
      const patchJson = JSON.stringify({ ...fields, updatedAt: fields.updatedAt || new Date().toISOString() });
      await conn.query(
        `UPDATE \`${model}\` SET data = JSON_MERGE_PATCH(data, ?), updatedAt = ? WHERE id = ?`,
        [patchJson, fields.updatedAt || new Date().toISOString(), id]
      );
      return this.getById(model, id);
    } catch {
      return null;
    }
  }

  async count(model: string): Promise<number> {
    try {
      const conn = this.拿到連線();
      const [rows] = await conn.execute(
        `SELECT COUNT(*) AS count FROM \`${model}\`;`
      ) as [any[], unknown];
      return rows[0]?.count ?? 0;
    } catch {
      return 0;
    }
  }

  async initialize(model: string): Promise<void> {
    if (this.已初始化.has(model)) return;
    try {
      await this.確保資料表(model);
      this.已初始化.add(model);

      // 若為空則匯入種子
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
              await error('MysqlAdapter', `匯入種子失敗 ${model}/${實例.id}: ${err}`);
            }
          }
          await info('MysqlAdapter', `${model} 種子匯入完成，共 ${items.length} 筆`);
        }
      }
    } catch (err) {
      await error('MysqlAdapter', `初始化 ${model} 失敗: ${err}`);
    }
  }

  /** 確保指定模型的資料表存在 */
  private async 確保資料表(model: string): Promise<void> {
    const conn = this.拿到連線();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`${model}\` (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL,
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX \`idx_${model}_updated\` (updatedAt DESC)
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
