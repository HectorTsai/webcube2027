// SurrealDB Adapter — 包裝現有的 Surreal資料庫 以實作 L3DatabaseAdapter 介面
import { L3DatabaseAdapter, 查詢選項 } from './adapter-interface.ts';
import Surreal資料庫 from '../core/surrealdb.ts';

export class SurrealAdapter implements L3DatabaseAdapter {
  readonly 類型 = 'surrealdb';
  private db: Surreal資料庫;

  constructor(db: Surreal資料庫) {
    this.db = db;
  }

  async 查詢單一(模型: string, id: string): Promise<Record<string, unknown> | null> {
    const 結果 = await this.db.查詢(
      `SELECT * FROM ${模型} WHERE id = '${id}' LIMIT 1;`
    );
    if (結果 && 結果[0] && 結果[0].result && 結果[0].result.length > 0) {
      return 結果[0].result[0] as Record<string, unknown>;
    }
    return null;
  }

  async 查詢列表(模型: string, 選項: 查詢選項): Promise<Record<string, unknown>[]> {
    const limit = 選項.limit ?? 50;
    const offset = 選項.offset ?? 0;
    const 結果 = await this.db.查詢(
      `SELECT * FROM ${模型} ORDER BY 最後修改 DESC LIMIT ${limit} START ${offset};`
    );
    if (結果 && 結果[0] && 結果[0].result) {
      return 結果[0].result as Record<string, unknown>[];
    }
    return [];
  }

  async 創建(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, id };
    const 結果 = await this.db.查詢(
      `CREATE ${id} CONTENT ${JSON.stringify(dataWithId)};`
    );
    if (結果 && 結果[0] && 結果[0].result && 結果[0].result.length > 0) {
      return 結果[0].result[0] as Record<string, unknown>;
    }
    return dataWithId;
  }

  async 更新(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, id };
    const 結果 = await this.db.查詢(
      `UPDATE ${id} CONTENT ${JSON.stringify(dataWithId)};`
    );
    if (結果 && 結果[0] && 結果[0].result && 結果[0].result.length > 0) {
      return 結果[0].result[0] as Record<string, unknown>;
    }
    return dataWithId;
  }

  async 刪除(模型: string, id: string): Promise<boolean> {
    try {
      await this.db.查詢(`DELETE FROM ${模型} WHERE id = '${id}';`);
      return true;
    } catch {
      return false;
    }
  }

  async 個數(模型: string): Promise<number> {
    return this.db.個數(模型);
  }

  async 初始化(模型: string): Promise<void> {
    await this.db.初始化(模型);
  }
}
