// SQL Server (MSSQL) Adapter — 使用 npm:mssql 實作 DatabaseAdapter 介面
// 每個 collection = 一張表，JSON 欄位儲存完整記錄
// 相容 Azure SQL Database
//
// 連線資訊對應（L2連線資訊 → SQL Server）：
//   主機  → server（例如 localhost 或 .database.windows.net）
//   埠號  → port（預設 1433）
//   使用者名稱 → user（例如 sa）
//   密碼  → password
//   資料庫名稱 → database（例如 webcube）
//   命名空間 → schema（選用，預設 "dbo"）

import sql from 'mssql';
import type { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';
import { error } from '../logger.ts';

export interface MssqlConnectOptions {
  server: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  schema?: string;
  /** 是否啟用加密（Azure SQL 必須為 true，預設 false）*/
  encrypt?: boolean;
}

export class MssqlAdapter implements DatabaseAdapter {
  readonly type = 'mssql';
  private pool!: sql.ConnectionPool;
  private schema: string;

  constructor(private 選項: MssqlConnectOptions) {
    this.schema = 選項.schema || 'dbo';
  }

  async connect(): Promise<void> {
    if (this.pool) return;

    this.pool = await sql.connect({
      server: this.選項.server,
      port: this.選項.port ?? 1433,
      user: this.選項.user,
      password: this.選項.password,
      database: this.選項.database,
      options: {
        encrypt: this.選項.encrypt ?? false,
        trustServerCertificate: !this.選項.encrypt,
      },
    });
  }

  private 拿到Pool(): sql.ConnectionPool {
    if (!this.pool) throw new Error('MSSQL Adapter 尚未初始化，請先呼叫 連線()');
    return this.pool;
  }

  /** 回傳完整表名（含 schema）*/
  private 表名(模型: string): string {
    return `[${this.schema}].[${模型}]`;
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
    try {
      const pool = this.拿到Pool();
      const result = await pool.request()
        .input('id', sql.NVarChar, id)
        .query(`SELECT data, updatedAt FROM ${this.表名(collection)} WHERE id = @id;`);

      if (result.recordset.length === 0) return null;
      const row = result.recordset[0];
      const raw = typeof row.data === 'string'
        ? JSON.parse(row.data) as Record<string, unknown>
        : row.data as Record<string, unknown>;
      return { id, ...raw, updatedAt: row.updatedAt ?? raw.updatedAt };
    } catch {
      return null;
    }
  }

  async list(collection: string, modelType?: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    const limitNum = options?.limit ?? 50;
    const offsetNum = options?.offset ?? 0;
    try {
      const pool = this.拿到Pool();
      const req = pool.request()
        .input('limit', sql.Int, limitNum)
        .input('offset', sql.Int, offsetNum);
      let querySql: string;
      if (modelType) {
        req.input('prefix', sql.NVarChar, `${collection}:${modelType}:%`);
        querySql = `SELECT data, updatedAt FROM ${this.表名(collection)} WHERE id LIKE @prefix ORDER BY updatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`;
      } else {
        querySql = `SELECT data, updatedAt FROM ${this.表名(collection)} ORDER BY updatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`;
      }
      const result = await req.query(querySql);

      return result.recordset.map((row: any) => {
        const raw = typeof row.data === 'string'
          ? JSON.parse(row.data) as Record<string, unknown>
          : (row.data as Record<string, unknown> ?? {});
        return { ...raw, updatedAt: row.updatedAt ?? raw.updatedAt };
      });
    } catch {
      return [];
    }
  }

  async create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...data, id, updatedAt: new Date().toISOString() };
    const pool = this.拿到Pool();
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('data', sql.NVarChar(sql.MAX), JSON.stringify(dataWithId))
      .input('updatedAt', sql.DateTime2, new Date(dataWithId.updatedAt))
      .query(
        `INSERT INTO ${this.表名(collection)} (id, data, updatedAt) VALUES (@id, @data, @updatedAt);`
      );
    return dataWithId;
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const 序列化資料 = typeof (data as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (data as { toJSON: () => Record<string, unknown> }).toJSON()
      : data;
    const dataWithId = { ...序列化資料, id, updatedAt: new Date().toISOString() };
    const pool = this.拿到Pool();

    // MERGE 實現 upsert
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('data', sql.NVarChar(sql.MAX), JSON.stringify(dataWithId))
      .input('updatedAt', sql.DateTime2, new Date(dataWithId.updatedAt))
      .query(`
        MERGE ${this.表名(collection)} AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET data = @data, updatedAt = @updatedAt
        WHEN NOT MATCHED THEN INSERT (id, data, updatedAt) VALUES (@id, @data, @updatedAt);`
      );

    return dataWithId;
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    try {
      const pool = this.拿到Pool();
      const req = pool.request()
        .input('val', sql.NVarChar, filter.value);
      let querySql: string;
      if (modelType) {
        req.input('prefix', sql.NVarChar, `${collection}:${modelType}:%`);
        querySql = `SELECT data, updatedAt FROM ${this.表名(collection)} WHERE JSON_VALUE(data, '$.${filter.field}') = @val AND id LIKE @prefix;`;
      } else {
        querySql = `SELECT data, updatedAt FROM ${this.表名(collection)} WHERE JSON_VALUE(data, '$.${filter.field}') = @val;`;
      }
      const result = await req.query(querySql);

      return result.recordset.map((row: any) => {
        const raw = typeof row.data === 'string'
          ? JSON.parse(row.data) as Record<string, unknown>
          : (row.data as Record<string, unknown> ?? {});
        return { ...raw, updatedAt: row.updatedAt ?? raw.updatedAt };
      });
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<boolean> {
    const collection = id.split(':')[0];
    try {
      const pool = this.拿到Pool();
      const result = await pool.request()
        .input('id', sql.NVarChar, id)
        .query(`DELETE FROM ${this.表名(collection)} WHERE id = @id;`);

      return result.rowsAffected[0] > 0;
    } catch {
      return false;
    }
  }

  async patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const pool = this.拿到Pool();
      // Read current data
      const result = await pool.request()
        .input('id', sql.NVarChar, id)
        .query(`SELECT data, updatedAt FROM ${this.表名(collection)} WHERE id = @id;`);
      if (result.recordset.length === 0) return null;
      const currentData = JSON.parse(result.recordset[0].data) as Record<string, unknown>;
      // Merge fields
      const merged = { ...currentData, ...fields, updatedAt: fields.updatedAt || new Date().toISOString() };
      // Write back
      const updateResult = await pool.request()
        .input('id', sql.NVarChar, id)
        .input('data', sql.NVarChar(sql.MAX), JSON.stringify(merged))
        .input('updatedAt', sql.DateTime2, new Date(merged.updatedAt as string))
        .query(`UPDATE ${this.表名(collection)} SET data = @data, updatedAt = @updatedAt WHERE id = @id;`);
      if (updateResult.rowsAffected[0] > 0) return merged;
      return null;
    } catch {
      return null;
    }
  }

  async count(collection: string, modelType?: string): Promise<number> {
    try {
      const pool = this.拿到Pool();
      const req = pool.request();
      let querySql: string;
      if (modelType) {
        req.input('prefix', sql.NVarChar, `${collection}:${modelType}:%`);
        querySql = `SELECT COUNT(*) AS count FROM ${this.表名(collection)} WHERE id LIKE @prefix;`;
      } else {
        querySql = `SELECT COUNT(*) AS count FROM ${this.表名(collection)};`;
      }
      const result = await req.query(querySql);

      return result.recordset[0]?.count ?? 0;
    } catch {
      return 0;
    }
  }

  async initialize(collection: string): Promise<void> {
    try {
      await this.確保資料表(collection);
    } catch (err) {
      await error('MssqlAdapter', `初始化 ${collection} 失敗: ${err}`);
    }
  }

  /** 確保資料表存在 */
  private async 確保資料表(model: string): Promise<void> {
    const pool = this.拿到Pool();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${model}' AND schema_id = SCHEMA_ID('${this.schema}'))
      CREATE TABLE ${this.表名(model)} (
        id NVARCHAR(255) PRIMARY KEY,
        data NVARCHAR(MAX) NOT NULL,
        updatedAt DATETIME2(3) NOT NULL DEFAULT GETUTCDATE()
      );
    `);

    // 確保索引
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_${model}_updated')
        CREATE INDEX idx_${model}_updated ON ${this.表名(model)} (updatedAt DESC);
    `);
  }

  async 關閉(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
    }
  }
}
