// SurrealDB Adapter — 實作 DatabaseAdapter 介面

import { DatabaseAdapter, QueryOptions, FieldFilter } from './adapter-interface.ts';

interface SurrealConfig {
  url: string;
  database: string;
  namespace: string;
  user: string;
  password: string;
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

  async getById(model: string, id: string): Promise<Record<string, unknown> | null> {
    const 結果 = await this.查詢(`SELECT * FROM ${model} WHERE _id = '${id}' LIMIT 1;`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return this.正規化(結果[0].result[0] as Record<string, unknown>);
    }
    return null;
  }

  async list(model: string, options: QueryOptions = {}): Promise<Record<string, unknown>[]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const 結果 = await this.查詢(
      `SELECT * FROM ${model} ORDER BY updatedAt DESC LIMIT ${limit} START ${offset};`
    );
    if (結果[0]?.result && Array.isArray(結果[0].result)) {
      return (結果[0].result as Record<string, unknown>[]).map(r => this.正規化(r));
    }
    return [];
  }

  async queryByField(model: string, filter: FieldFilter): Promise<Record<string, unknown>[]> {
    const 結果 = await this.查詢(
      `SELECT * FROM ${model} WHERE ${filter.field} = '${filter.value}' LIMIT 1;`
    );
    if (結果[0]?.result && Array.isArray(結果[0].result)) {
      return (結果[0].result as Record<string, unknown>[]).map(r => this.正規化(r));
    }
    return [];
  }

  async create(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // 用 _id 儲存 composite ID，保留 id 給 SurrealDB 自己管理
    const forSurreal = { ...data, _id: id };
    const 結果 = await this.查詢(`CREATE ${model} CONTENT ${JSON.stringify(forSurreal)};`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return this.正規化(結果[0].result[0] as Record<string, unknown>);
    }
    // fallback: 回傳我們自己組的資料
    return { id, ...data };
  }

  async update(model: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // 用 _id 查詢，保留 id 給 SurrealDB 自己管理
    const forSurreal = { ...data, _id: id };
    const 結果 = await this.查詢(`UPDATE ${model} CONTENT ${JSON.stringify(forSurreal)} WHERE _id = '${id}';`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return this.正規化(結果[0].result[0] as Record<string, unknown>);
    }
    return { id, ...data };
  }

  async delete(model: string, id: string): Promise<boolean> {
    try {
      await this.查詢(`DELETE FROM ${model} WHERE _id = '${id}';`);
      return true;
    } catch {
      return false;
    }
  }

  async patch(model: string, id: string, fields: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const setClauses = Object.entries(fields)
        .map(([key, val]) => `${key} = ${typeof val === 'string' ? `'${val.replace(/'/g, "\\'")}'` : JSON.stringify(val)}`)
        .join(', ');
      const updatedAt = fields.updatedAt || new Date().toISOString();
      await this.查詢(`UPDATE ${model} SET ${setClauses}, updatedAt = '${updatedAt}' WHERE _id = '${id}';`);
      return this.getById(model, id);
    } catch {
      return null;
    }
  }

  async count(model: string): Promise<number> {
    try {
      const res = await this.查詢(`SELECT count() FROM ${model};`);
      const first = res?.[0] as Record<string, unknown> | undefined;
      const val = first?.count ?? (first as Record<string, unknown[]>)?.count?.[0];
      return typeof val === 'number' ? val : 0;
    } catch {
      return 0;
    }
  }

  async initialize(_model: string): Promise<void> {
    try {
      await this.查詢('INFO FOR DB;');
    } catch {
      return;
    }
  }
}
