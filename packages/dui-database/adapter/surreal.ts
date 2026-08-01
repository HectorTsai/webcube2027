// SurrealDB Adapter — 實作 DatabaseAdapter 介面

import { DatabaseAdapter, QueryOptions, FieldFilter, isSafeIdentifier } from './adapter-interface.ts';

interface SurrealConfig {
  url: string;
  database: string;
  namespace: string;
  user: string;
  password: string;
}

/** Escape single quotes for SurrealDB SQL (防止 SQL Injection) */
function esc(val: string): string {
  return val.replace(/'/g, "\\'");
}

export class SurrealAdapter implements DatabaseAdapter {
  readonly type = 'surrealdb';
  private config: SurrealConfig;
  private token: string | null = null;

  constructor(config: SurrealConfig) {
    this.config = config;
  }

  // ── 連線 ──

  async login(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.config.url}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespace: this.config.namespace,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
        }),
      });
      if (!resp.ok) return false;
      const body = await resp.json();
      this.token = (body?.token as string) ?? null;
      return !!this.token;
    } catch {
      return false;
    }
  }

  // ── 內部 ──

  private get headers(): Record<string, string> {
    if (!this.token) throw new Error('尚未登入 SurrealDB');
    return {
      Authorization: `Bearer ${this.token}`,
      NS: this.config.namespace,
      DB: this.config.database,
      'Content-Type': 'text/plain',
    };
  }

  private async 查詢(sql: string | string[]): Promise<Record<string, unknown>[]> {
    try {
      const stmt = Array.isArray(sql) ? sql.join('\n') : sql;
      const doQuery = () =>
        fetch(`${this.config.url}/sql`, {
          method: 'POST',
          headers: this.headers,
          body: stmt,
        });

      let resp = await doQuery();
      if (!resp.ok && (resp.status === 401 || resp.status === 403)) {
        if (await this.login()) resp = await doQuery();
        else return [];
      }
      if (!resp.ok) return [];

      return await resp.json() as Record<string, unknown>[];
    } catch {
      return [];
    }
  }

  // ── SurrealDB 注意 ──
  // SurrealDB 的 id 欄位是內建 record ID，查詢結果中的 id 永遠是 DB 產生的（如 user:abcdef），
  // 而非我們存入的 composite ID（如 User:User:abc123）。
  // 因此我們另外存一個 _id 欄位（我們的 composite ID），保留 id 給 SurrealDB 自己管理。
  // 讀取時再將 _id 正規化回 id。

  /** 從 SurrealDB 結果正規化 id 欄位（_id → id） */
  private 正規化(結果: Record<string, unknown>): Record<string, unknown> {
    const { _id, ...rest } = 結果;
    return { id: _id ?? 結果.id, ...rest };
  }

  // ── DatabaseAdapter 實作 ──

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const collection = id.split(':')[0];
    // collection 會直接拼入表名位置，必須驗證避免 SQL 注入
    if (!isSafeIdentifier(collection)) return null;
    const 結果 = await this.查詢(`SELECT * FROM ${collection} WHERE _id = '${esc(id)}' LIMIT 1;`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return this.正規化(結果[0].result[0] as Record<string, unknown>);
    }
    return null;
  }

  async list(collection: string, modelType?: string, options?: QueryOptions): Promise<Record<string, unknown>[]> {
    if (!isSafeIdentifier(collection)) return [];
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    let sql: string;
    if (modelType) {
      sql = `SELECT * FROM ${collection} WHERE _id LIKE '${esc(collection)}:${esc(modelType)}:%' ORDER BY updatedAt DESC LIMIT ${limit} START ${offset};`;
    } else {
      sql = `SELECT * FROM ${collection} ORDER BY updatedAt DESC LIMIT ${limit} START ${offset};`;
    }
    const 結果 = await this.查詢(sql);
    if (結果[0]?.result && Array.isArray(結果[0].result)) {
      return (結果[0].result as Record<string, unknown>[]).map(r => this.正規化(r));
    }
    return [];
  }

  async queryByField(collection: string, filter: FieldFilter, modelType?: string): Promise<Record<string, unknown>[]> {
    // filter.field 直接拼入 WHERE、collection 直接拼入表名，皆需驗證避免注入
    if (!isSafeIdentifier(filter.field) || !isSafeIdentifier(collection)) return [];
    let sql: string;
    if (modelType) {
      sql = `SELECT * FROM ${collection} WHERE ${filter.field} = '${esc(filter.value)}' AND _id LIKE '${esc(collection)}:${esc(modelType)}:%';`;
    } else {
      sql = `SELECT * FROM ${collection} WHERE ${filter.field} = '${esc(filter.value)}';`;
    }
    const 結果 = await this.查詢(sql);
    if (結果[0]?.result && Array.isArray(結果[0].result)) {
      return (結果[0].result as Record<string, unknown>[]).map(r => this.正規化(r));
    }
    return [];
  }

  async create(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) throw new Error(`SurrealAdapter: 非法 collection 名稱: ${collection}`);
    // 用 _id 儲存 composite ID，保留 id 給 SurrealDB 自己管理
    const forSurreal = { ...data, _id: id };
    const 結果 = await this.查詢(`CREATE ${collection} CONTENT ${JSON.stringify(forSurreal)};`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return this.正規化(結果[0].result[0] as Record<string, unknown>);
    }
    // fallback: 回傳我們自己組的資料
    return { id, ...data };
  }

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!isSafeIdentifier(collection)) throw new Error(`SurrealAdapter: 非法 collection 名稱: ${collection}`);
    // 用 _id 查詢，保留 id 給 SurrealDB 自己管理
    const forSurreal = { ...data, _id: id };
    const 結果 = await this.查詢(`UPDATE ${collection} CONTENT ${JSON.stringify(forSurreal)} WHERE _id = '${esc(id)}';`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return this.正規化(結果[0].result[0] as Record<string, unknown>);
    }
    return { id, ...data };
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = id.split(':')[0];
      if (!isSafeIdentifier(collection)) return false;
      await this.查詢(`DELETE FROM ${collection} WHERE _id = '${esc(id)}';`);
      return true;
    } catch {
      return false;
    }
  }

  async patch(collection: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      if (!isSafeIdentifier(collection)) return null;
      // 統一拼裝 SET 子句：先帶入預設 updatedAt，fields 若有則覆蓋，避免重複出現同欄位
      const payload: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
        ...fields,
      };
      // 統一轉義所有值：字串單引號逸出；數字/布林直接寫入；
      // 物件/陣列轉為 JSON 結構（不加引號），維持 SurrealDB 原生型態。
      // 注意：JSON.stringify 產物是自洽 JSON（雙引號字串內的單引號不需逸出），
      //       不可再套 esc()，否則會產生 \' 這類非合法 JSON 逸出序列。
      const 轉義值 = (val: unknown): string => {
        if (typeof val === 'string') return `'${esc(val)}'`;
        if (typeof val === 'number' || typeof val === 'boolean' || val === null) return String(val);
        return JSON.stringify(val);
      };
      const setClauses = Object.entries(payload)
        // 欄位名稱僅允許安全識別元，避免外部 key 直接拼入 SET 子句
        .filter(([key]) => isSafeIdentifier(key))
        .map(([key, val]) => `${key} = ${轉義值(val)}`)
        .join(', ');
      await this.查詢(`UPDATE ${collection} SET ${setClauses} WHERE _id = '${esc(id)}';`);
      return this.getById(id);
    } catch {
      return null;
    }
  }

  async count(collection: string, modelType?: string): Promise<number> {
    try {
      if (!isSafeIdentifier(collection)) return 0;
      let sql: string;
      if (modelType) {
        sql = `SELECT count() FROM ${collection} WHERE _id LIKE '${esc(collection)}:${esc(modelType)}:%';`;
      } else {
        sql = `SELECT count() FROM ${collection};`;
      }
      const res = await this.查詢(sql);
      // SurrealDB 回傳結構: [ { result: [ { count: N } ] } ]
      const resultArr = res?.[0]?.result as Record<string, unknown>[] | undefined;
      const first = resultArr?.[0];
      const val = first?.count;
      return typeof val === 'number' ? val : 0;
    } catch {
      return 0;
    }
  }

  /** 輕量連線檢查 */
  async ping(): Promise<boolean> {
    const 結果 = await this.查詢('INFO FOR DB;');
    return 結果.length > 0;
  }

  async initialize(_collection: string): Promise<void> {
    try {
      await this.查詢('INFO FOR DB;');
    } catch {
      return;
    }
  }
}