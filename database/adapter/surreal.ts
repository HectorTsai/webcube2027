// SurrealDB Adapter — 實作 DatabaseAdapter 介面

import { DatabaseAdapter, 查詢選項, 欄位篩選 } from './adapter-interface.ts';

interface SurrealConfig {
  url: string;
  database: string;
  namespace: string;
  user: string;
  password: string;
}

export class SurrealAdapter implements DatabaseAdapter {
  readonly 類型 = 'surrealdb';
  private config: SurrealConfig;
  private token: string | null = null;

  constructor(config: SurrealConfig) {
    this.config = config;
  }

  // ── 連線 ──

  async 登入(): Promise<boolean> {
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
        if (await this.登入()) resp = await doQuery();
        else return [];
      }
      if (!resp.ok) return [];

      return await resp.json() as Record<string, unknown>[];
    } catch {
      return [];
    }
  }

  // ── DatabaseAdapter 實作 ──

  async 查詢單一(模型: string, id: string): Promise<Record<string, unknown> | null> {
    const 結果 = await this.查詢(`SELECT * FROM ${模型} WHERE id = '${id}' LIMIT 1;`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return 結果[0].result[0] as Record<string, unknown>;
    }
    return null;
  }

  async 查詢列表(模型: string, 選項: 查詢選項 = {}): Promise<Record<string, unknown>[]> {
    const limit = 選項.limit ?? 50;
    const offset = 選項.offset ?? 0;
    const 結果 = await this.查詢(
      `SELECT * FROM ${模型} ORDER BY 最後修改 DESC LIMIT ${limit} START ${offset};`
    );
    if (結果[0]?.result && Array.isArray(結果[0].result)) {
      return 結果[0].result as Record<string, unknown>[];
    }
    return [];
  }

  async 查詢依欄位(模型: string, 篩選: 欄位篩選): Promise<Record<string, unknown>[]> {
    const 結果 = await this.查詢(
      `SELECT * FROM ${模型} WHERE ${篩選.欄位} = '${篩選.值}' LIMIT 1;`
    );
    if (結果[0]?.result && Array.isArray(結果[0].result)) {
      return 結果[0].result as Record<string, unknown>[];
    }
    return [];
  }

  async 創建(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, id };
    const 結果 = await this.查詢(`CREATE ${模型} CONTENT ${JSON.stringify(dataWithId)};`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return 結果[0].result[0] as Record<string, unknown>;
    }
    return dataWithId;
  }

  async 更新(模型: string, id: string, 資料: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataWithId = { ...資料, id };
    const 結果 = await this.查詢(`UPDATE ${id} CONTENT ${JSON.stringify(dataWithId)};`);
    if (結果[0]?.result && Array.isArray(結果[0].result) && 結果[0].result.length > 0) {
      return 結果[0].result[0] as Record<string, unknown>;
    }
    return dataWithId;
  }

  async 刪除(模型: string, id: string): Promise<boolean> {
    try {
      await this.查詢(`DELETE FROM ${模型} WHERE id = '${id}';`);
      return true;
    } catch {
      return false;
    }
  }

  async 個數(模型: string): Promise<number> {
    try {
      const res = await this.查詢(`SELECT count() FROM ${模型};`);
      const first = res?.[0] as Record<string, unknown> | undefined;
      const val = first?.count ?? (first as Record<string, unknown[]>)?.count?.[0];
      return typeof val === 'number' ? val : 0;
    } catch {
      return 0;
    }
  }

  async 初始化(模型: string): Promise<void> {
    try {
      await this.查詢('INFO FOR DB;');
    } catch {
      return;
    }

    if (await this.個數(模型) === 0) {
      const { 讀取種子 } = await import('../index.ts');
      const items = await 讀取種子(模型);

      if (!items || items.length === 0) return;

      for (const 實例 of items) {
        try {
          await (實例 as { 初始化?: () => Promise<void> }).初始化?.();
          await this.創建(模型, (實例 as { id: string }).id, (實例 as { toJSON: () => Record<string, unknown> }).toJSON());
        } catch { /* skip */ }
      }
    }
  }
}
